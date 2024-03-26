import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Table from "react-bootstrap/Table";
import { useNavigate } from "react-router-dom";
import Moment from 'moment';
import { Spinner } from "react-bootstrap";

export default function Home() {
  const [showSpinner, setShowSpinner] = useState([true]);
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const [approvedPatents, setApprovedPatents] = useState([]);
  const sort = useRef()
  const [sortIcon, setSortIcon] = useState([]);
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const lag = useRef()
  const [aboveLoading, setAboveLoading] = useState(false)
  const reachBottom = useRef()
  const nextTokenStr = useRef()
  const prevTokenStr = useRef()
  const navigate = useNavigate();
  const keyword = useRef()
  const observer = useRef()
  const lastBookElementRef = useCallback(node => {
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {

      if (entries[0].isIntersecting && hasMore && lag.current === true) {
        if (loading) {
          moreData()
        }
        setLoading(true)
      }
    })
    if (node) observer.current.observe(node)


  }, [hasMore, loading])


  const observer2 = useRef()
  const firstPatentElementRef = useCallback(node => {
    if (observer2.current) observer2.current.disconnect()
    observer2.current = new IntersectionObserver(entries => {

      if (entries[0].isIntersecting && hasPrevious && (approvedPatents.length === 500 || !hasMore) && lag.current === true) {
        if (aboveLoading) {
          prevMoreData()

        }
        setAboveLoading(true)
      }
    })
    if (node) observer2.current.observe(node)
  }, [hasPrevious, aboveLoading])



  useEffect(() => {
    setSortIcon(<i className="fa-solid fa-sort" style={{ marginLeft: "1em" }}></i>);
    sort.current = true
    lag.current = true
    reachBottom.current = false
    getApprovedPatents();

  }, []);


  const moreData = async () => {
    try {
      const date = sort.current ? 1 : -1
      const path = base_url + "public/patent?token=" + nextTokenStr.current[0];

      await axios.get(path, {
        params: {
          createdAt: date,
          keyword: keyword.current
        }
      }).then((response) => {
        if (response !== undefined) {
          setLoading(false)
          let length = approvedPatents.length + response.data.data.length
          let allPatentList = response.data.data.map((item) => {
            item.createdAt = Moment(item.createdAt).format('DD-MM-YYYY')
            return { ...item, statusName: "Approved" };
          });


          if (prevTokenStr.current) {
            if (prevTokenStr.current.length === 5) {

              if (!reachBottom.current) {
                let arr = [...prevTokenStr.current.slice(1, 5), response.data.previousToken]
                prevTokenStr.current = arr

              }
              else {
                reachBottom.current = false
              }

            }
            else {
              let arr = [...prevTokenStr.current, response.data.previousToken]
              prevTokenStr.current = arr

            }
          }
          else {
            let arr = [response.data.previousToken]
            prevTokenStr.current = arr
          }
          if (length > 500) {
            lag.current = false
            setHasMore(false)
            setHasPrevious(true)
            setTimePatents(allPatentList).then(() => {
              setTimeout(() => {
                executeScroll()
              }, 300);

            })

            setLoading(false)
            setTimeout(() => {
              lag.current = true
            }, 500);

          }
          else {
            setApprovedPatents((prevState) => [...prevState, ...allPatentList]);

          }
          if (response.data.token) {
            if (nextTokenStr.current.length >= 5) {
              let a = [response.data.token, ...nextTokenStr.current]

              nextTokenStr.current = a
            }
            else {
              nextTokenStr.current = [response.data.token, ...nextTokenStr.current]
            }
            setHasMore(true)
          }
          else {
            setHasMore(false)
          }
          setLoading(false)
        }
      });
    } catch (error) { }
  };
  const setTimePatents = async (array) => {
    setApprovedPatents((prevState) => [...prevState.slice(100, 500), ...array], executeScroll());
  }

  const prevMoreData = async () => {

    try {
      const date = sort.current ? 1 : -1
      const path = base_url + "public/patent?token=" + prevTokenStr.current[0];

      await axios.get(path, {
        params: {
          createdAt: date,
          keyword: keyword.current
        }
      }).then((response) => {
        if (response !== undefined) {
          setAboveLoading(false)
          let allPatentList = response.data.data
          lag.current = false
          if (response.data.previousToken) {
            setHasPrevious(true)
            prevTokenStr.current = [response.data.previousToken, ...prevTokenStr.current.slice(0, prevTokenStr.current.length - 1)]

          }
          else {
            setHasPrevious(false)
            reachBottom.current = true
          }
          setConditionalPatents(allPatentList)
            .then(() => {
              setTimeout(() => {
                executeFirstScroll()

              }, 300);
            })
          setAboveLoading(false)
          if (hasMore) {
            nextTokenStr.current = nextTokenStr.current.slice(1, nextTokenStr.current.length)

          }
          setHasMore(true)
          setTimeout(() => {
            lag.current = true

          }, 500);
        }
      });
    } catch (error) { }

  }
  const setConditionalPatents = async (array) => {
    setApprovedPatents((prevState) => [...array, ...prevState.slice(0, 400)], executeFirstScroll())
  }

  const executeScroll = async () => {
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight / 1.27, behavior: 'auto' })
    }, 100);
  }
  const executeFirstScroll = async () => {
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight / 4.85, behavior: 'auto' })
    }, 100);

  }

  const patentClick = (e, id) => {
    e.preventDefault();
    localStorage.setItem("patentId", id);
    navigate("/patentDetails/" + id);
  };

  const getApprovedPatents = async () => {
    try {
      setShowSpinner(true)
      const date = sort.current ? 1 : -1
      const path = base_url + "public/patent";

      await axios.get(path
        , {
          params: {
            createdAt: date,
            keyword: keyword.current
          }
        }
      ).then((response) => {
        setShowSpinner(false)
        if (response !== undefined) {
          let allPatentList = response.data.data.map((item) => {
            item.createdAt = Moment(item.createdAt).format('DD-MM-YYYY')
            return { ...item, statusName: "Approved" };
          });

          setApprovedPatents(allPatentList);
          if (response.data.token) {
            setHasMore(true)
          }
          else {
            setHasMore(false)
          }

          nextTokenStr.current = [response.data.token]
        }
      });
    } catch (error) { }
  };

  const buttonClick = (e) => {
    e.preventDefault()

    let value = e.target[0].value
    keyword.current = value
    getApprovedPatents()

  };
  const onInputChange = (e) => {
    e.preventDefault();
    if (e.target.value === '') {
      keyword.current = ''
      getApprovedPatents()
    }
  }
  const sortClick = () => {
    sort.current = !sort.current
    sort.current ? setSortIcon(<i className="fa-solid fa-sort-up" style={{ marginLeft: "1em" }}></i>) : setSortIcon(<i className="fa-solid fa-sort-down" style={{ marginLeft: "1em" }}></i>)
    getApprovedPatents()
  }


  return (
    <>
      <div className="container table_container mb_L">
        <div className="panel">
          <div className="panel-heading">Patents</div>

          <div className="pc-task_list">
            <div className="row py-3">
              <div className="col-lg-9"></div>
              <div className="col-lg-3 ">
                <form onSubmit={e => buttonClick(e)} >
                  <div className="input-group">
                    <input
                      type="search"
                      onChange={onInputChange}
                      className="form-control"
                      placeholder="Search "

                    />
                    <span className="input-group-btn pl-1">
                      <button
                        className="btn btn-search"
                        style={{
                          backgroundColor: "#144399",
                          color: "white",
                        }}
                        type="submit"
                      >
                        <i className="fa fa-search fa-fw"></i>{" "}
                      </button>
                    </span>
                  </div>
                </form>
              </div>
            </div>
            <Table className="shadow bg-white rounded" responsive>
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>Sl.no</th>
                  <th style={{ width: "20%",whiteSpace: "nowrap" }}>Patent Name</th>
                  <th style={{ width: "35%" }}>Description</th>
                  <th style={{ width: "20%" }}>Owner</th>
                  <th style={{ width: "10%" }} onClick={sortClick}>Date {sortIcon}</th>
                </tr>
              </thead>
              <tbody>

                {aboveLoading ?
                  <tr><td
                    className="text-center border-cstm-btm" colSpan={6}>
                    <Spinner animation="border" variant="primary" role="status">
                    </Spinner>
                  </td>
                  </tr>
                  : ""}

                {approvedPatents.length > 0 ?
                  approvedPatents.map((result, index) => {

                    if (index === 0) {
                      return (
                        <tr ref={firstPatentElementRef} style={{
                          "borderColor": "inherit",
                          "borderStyle": "solid",
                          "borderWidth": "thin"
                        }} key={index} >
                          <td>{result.index}</td>
                          <td><a onClick={e => patentClick(e, result.id)} href=" ">{result.patentName}</a></td>
                          <td className="td_textwrap">{result.description}</td>
                          <td>{result.user[0].name}</td>
                          <td>{result.createdAt}</td>
                        </tr>
                      )
                    }


                    if (approvedPatents.length === index + 1) {
                      return (
                        <tr ref={lastBookElementRef} style={{
                          "borderColor": "inherit",
                          "borderStyle": "solid",
                          "borderWidth": "thin"
                        }} key={index} >

                          <td>{result.index}</td>
                          <td><a onClick={e => patentClick(e, result.id)} href=" ">{result.patentName}</a></td>
                          <td className="td_textwrap">{result.description}</td>
                          <td>{result.user[0].name}</td>
                          <td style={{whiteSpace: "nowrap"}}>{result.createdAt}</td>
                        </tr>
                      )
                    }
                    return (
                      <tr style={{
                        "borderColor": "inherit",
                        "borderStyle": "solid",
                        "borderWidth": "thin"
                      }} key={index} >
                        <td>{result.index}</td>

                        <td><a onClick={e => patentClick(e, result.id)} href=" ">{result.patentName}</a></td>
                        <td className="td_textwrap">{result.description}</td>
                        <td>{result.user[0].name}</td>
                        <td>{result.createdAt}</td>
                      </tr>
                    );
                  }) : <tr><td
                    className="text-center border-cstm-btm" colSpan={5}>
                    {showSpinner ? <Spinner animation="border" variant="primary" role="status">
                    </Spinner> : 'No data'}
                  </td>
                  </tr>}
              </tbody>
            </Table>
            <div className="text-center">
              {loading ? <Spinner animation="border" variant="primary" role="status" >
              </Spinner> : ''}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
