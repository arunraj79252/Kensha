import React, { useState, useEffect, useRef, useCallback } from "react";
import Table from 'react-bootstrap/Table';
import useAppContext from "../../AppContext";
import { MultiSelect } from 'primereact/multiselect';
import '../../App.css'
import "primeicons/primeicons.css";
import Moment from 'moment';
import { useNavigate } from "react-router-dom";
import Spinner from 'react-bootstrap/Spinner'
import getStatusName from "../Status";

export default function AllPatents() {
    const appContext = useAppContext();
    const base_url = process.env.REACT_APP_API_ENDPOINT;
    const [patents, setPatents] = useState([])
    const [selectedStatus, setSelectedStatus] = useState([]);
    const [showSpinner, setShowSpinner] = useState([true]);
    const [sortIcon, setSortIcon] = useState([]);
    const [prevToken, setPrevToken] = useState([])
    const reachBottom = useRef()
    const prevTokenStr = useRef()
    const nextTokenStr = useRef()
    const lag = useRef()
    const [hasPrevious, setHasPrevious] = useState(false)
    const paginationToken = useRef();
    const myRef = useRef(null)
    const myFirstRef = useRef(null)
    const [loading, setLoading] = useState(false)
    const [aboveLoading, setAboveLoading] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const sort = useRef()
    const navigate = useNavigate();
    const keyword = useRef()
    const statusFilter = useRef()
    useEffect(() => {
        setSortIcon(<i className="fa-solid fa-sort" style={{ marginLeft: "1em" }}></i>);
        getAllPatents();
        lag.current = true
        reachBottom.current = false

    }, []);

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

            if (entries[0].isIntersecting && hasPrevious && (patents.length === 500 || !hasMore) && lag.current === true) {
                if (aboveLoading) {
                    prevMoreData()

                }
                setAboveLoading(true)
            }
        })
        if (node) observer2.current.observe(node)
    }, [hasPrevious, aboveLoading])

    const status = [
        { name: 'Applied', code: 0 },
        { name: 'Review started', code: 1 },
        { name: 'Transaction pending', code: 2 },
        { name: 'Rejected', code: 3 },
        { name: 'Approved', code: 4 },
        { name: 'Resubmitted', code: 5 },
        {name: 'Ready for payment',code:6}
    ];
    const patentClick = (e, id) => {
        e.preventDefault();
        localStorage.setItem("patentId", id);
        navigate("/details/" + id);
    }
    const onStatusChange = async (value) => {
        setShowSpinner(true)
        let selected = [];
        if (value.length !== 0) {
            selected.push(value[value.length - 1])
            setSelectedStatus(selected)
            statusFilter.current = selected[0].code;
            getAllPatents();
        }
        else {
            statusFilter.current = null;
            setSelectedStatus(null)
            getAllPatents();
        }

    }

    let allPatentList = []

    const sortClick = () => {
        sort.current = !sort.current;
        sort.current ? setSortIcon(<i className="fa-solid fa-sort-up" style={{ marginLeft: "1em" }}></i>) : setSortIcon(<i className="fa-solid fa-sort-down" style={{ marginLeft: "1em" }}></i>)
        getAllPatents()
    }

    const getAllPatents = async () => {
        try {
            let dateSort = sort.current ? 1 : -1
            let params = {
                createdAt: dateSort,
                keyword: keyword.current,
                status: statusFilter.current
            }
            let path = base_url + 'admin/patents';
            await appContext.getAxios().get(path, { params }).then((response) => {

                if (response !== undefined) {
                    allPatentList = response.data.data;
                    setPatents(allPatentList)
                    setShowSpinner(false)
                    paginationToken.current = response.data.nextToken
                    if (response.data.nextToken) {
                        nextTokenStr.current = [response.data.nextToken]

                        setHasMore(true)
                    }
                    else {
                        setHasMore(false)
                    }
                }
            })

        } catch (error) {
            console.log(error);
        }
    }

    const moreData = async () => {
        let dateSort = sort.current ? 1 : -1
        let params = {
            createdAt: dateSort,
            keyword: keyword.current,
            token: nextTokenStr.current[0],
            status: statusFilter.current
        }

        const path = base_url + 'admin/patents';
        setLoading(true)
        await appContext.getAxios().get(path, { params }).then((response) => {
            if (response !== undefined) {
                allPatentList = response.data.data;
                let length = patents.length + response.data.data.length
                if (!prevToken || hasPrevious) {
                    //     setPrevToken(response.data.previousToken)

                }


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
                    setPatents((prevState) => [...prevState, ...allPatentList]);

                }
                if (response.data.nextToken) {
                    setHasMore(true)
                    if (nextTokenStr.current.length >= 5) {
                        let a = [response.data.nextToken, ...nextTokenStr.current]

                        nextTokenStr.current = a
                    }
                    else {
                        nextTokenStr.current = [response.data.nextToken, ...nextTokenStr.current]
                    }



                }
                else {
                    setHasMore(false)
                }
                setLoading(false)
            }
        })
    }
    const setTimePatents = async (array) => {
        setPatents((prevState) => [...prevState.slice(100, 500), ...array], executeScroll());
    }
    const prevMoreData = async () => {
        let dateSort = sort.current ? 1 : -1
        let params = {
            createdAt: dateSort,
            keyword: keyword.current,
            token: prevTokenStr.current[0],
            status: statusFilter.current
        }
        const path = base_url + 'admin/patents';



        await appContext.getAxios().get(path, { params }).then((response) => {
            if (response !== undefined) {
                setAboveLoading(false)
                allPatentList = response.data.data;
                lag.current = false
                if (response.data.previousToken) {
                    setHasPrevious(true)
                    prevTokenStr.current = [response.data.previousToken, ...prevTokenStr.current.slice(0, prevTokenStr.current.length - 1)]

                }
                else {
                    setHasPrevious(false)
                    setPrevToken([])
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
                else {
                    setHasMore(true)
                }
                setTimeout(() => {
                    lag.current = true

                }, 500);

            }
        })
    }


    const setConditionalPatents = async (array) => {
        setPatents((prevState) => [...array, ...prevState.slice(0, 400)], executeFirstScroll())
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

    const buttonClick = (e) => {
        e.preventDefault()
        let value = e.target[0].value
        keyword.current = value
        getAllPatents()

    };
    const onInputChange = (e) => {
        e.preventDefault();
        if (e.target.value === '') {
            keyword.current = ''
            getAllPatents()
        }
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
                                    <th style={{ width: "30%" }}>Description</th>
                                    <th style={{ width: "15%" }}>Owner</th>
                                    <th style={{ width: "12%" }} onClick={sortClick}>Date {sortIcon}</th>
                                    <th style={{ width: "18%",whiteSpace: "nowrap" }}>Status <MultiSelect value={selectedStatus} options={status} onChange={(e) => onStatusChange(e.value)} optionLabel="name" placeholder="" maxSelectedLabels={1} /></th>
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
                                {patents.length > 0
                                    ? patents.map((result, index) => {
                                        if (patents.length === index + 1) {
                                            return (
                                                <tr ref={lastBookElementRef}
                                                    style={{
                                                        borderColor: "inherit",
                                                        borderStyle: "solid",
                                                        borderWidth: "thin",
                                                    }} key={index}>
                                                    <td>{result.index}</td>
                                                    <td>
                                                        <a href=" " onClick={(e) => patentClick(e, result.id)}>
                                                            {result.patentName}
                                                        </a>
                                                    </td>
                                                    <td className="td_textwrap">{result.description}</td>
                                                    <td style={{ overflow: "hidden" }}> {result.user.length > 0 ? result.user[0].name : ''} </td>
                                                    <td style={{ whiteSpace: "nowrap" }}>{Moment(result.createdAt).format('DD-MM-YYYY')}</td>
                                                    <td>{getStatusName(result.status)}</td>
                                                </tr>
                                            );
                                        }
                                        if (index === 400) {
                                            return (
                                                <tr ref={myRef}
                                                    style={{
                                                        borderColor: "inherit",
                                                        borderStyle: "solid",
                                                        borderWidth: "thin",
                                                    }} key={index}>
                                                    <td>{result.index}</td>
                                                    <td>
                                                        <a href=" " onClick={(e) => patentClick(e, result.id)}>
                                                            {result.patentName}
                                                        </a>
                                                    </td>
                                                    <td className="td_textwrap">{result.description}</td>
                                                    <td style={{ overflow: "hidden" }}> {result.user.length > 0 ? result.user[0].name : ''} </td>
                                                    <td>{Moment(result.createdAt).format('DD-MM-YYYY')}</td>
                                                    <td>{getStatusName(result.status)}</td>
                                                </tr>
                                            );
                                        }
                                        if (index === 0) {
                                            return (
                                                <tr ref={firstPatentElementRef}
                                                    style={{
                                                        borderColor: "inherit",
                                                        borderStyle: "solid",
                                                        borderWidth: "thin",
                                                    }} key={index}>
                                                    <td>{result.index}</td>
                                                    <td>
                                                        <a href=" " onClick={(e) => patentClick(e, result.id)}>
                                                            {result.patentName}
                                                        </a>
                                                    </td>
                                                    <td className="td_textwrap">{result.description}</td>
                                                    <td style={{ overflow: "hidden" }}> {result.user.length > 0 ? result.user[0].name : ''} </td>
                                                    <td>{Moment(result.createdAt).format('DD-MM-YYYY')}</td>
                                                    <td>{getStatusName(result.status)}</td>
                                                </tr>
                                            );
                                        }
                                        if (index === 100) {
                                            return (
                                                <tr ref={myFirstRef}
                                                    style={{
                                                        borderColor: "inherit",
                                                        borderStyle: "solid",
                                                        borderWidth: "thin",
                                                    }} key={index}>
                                                    <td>{result.index}</td>
                                                    <td>
                                                        <a href=" " onClick={(e) => patentClick(e, result.id)}>
                                                            {result.patentName}
                                                        </a>
                                                    </td>
                                                    <td className="td_textwrap">{result.description}</td>
                                                    <td style={{ overflow: "hidden" }}> {result.user.length > 0 ? result.user[0].name : ''} </td>
                                                    <td>{Moment(result.createdAt).format('DD-MM-YYYY')}</td>
                                                    <td>{getStatusName(result.status)}</td>
                                                </tr>
                                            );
                                        }

                                        return (
                                            <tr style={{
                                                borderColor: "inherit",
                                                borderStyle: "solid",
                                                borderWidth: "thin",
                                            }} key={index}>
                                                <td>{result.index}</td>
                                                <td>
                                                    <a href=" " onClick={(e) => patentClick(e, result.id)}>
                                                        {result.patentName}
                                                    </a>
                                                </td>
                                                <td className="td_textwrap">{result.description}</td>
                                                <td style={{ overflow: "hidden" }}> {result.user[0] ? result.user[0].name : ''} </td>
                                                <td>{Moment(result.createdAt).format('DD-MM-YYYY')}</td>
                                                <td>{getStatusName(result.status)}</td>
                                            </tr>
                                        );
                                    })
                                    : <tr><td
                                        className="text-center border-cstm-btm" colSpan={6}>
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
