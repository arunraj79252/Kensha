import React, { useEffect, useState } from "react";
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Bar, Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import zoomPlugin from 'chartjs-plugin-zoom';
import useAppContext from "../../AppContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
Chart.register(zoomPlugin);
function Dashboard(props) {
    const appContext = useAppContext();
    const base_url = process.env.REACT_APP_API_ENDPOINT;
    const [isHour, setIsHour] = useState(false)
    const [approved, setApproved] = useState(0)
    const [applied, setApplied] = useState(0)
    const [rejected, setRejected] = useState(0)
    const [userCount, setUserCount] = useState(0)
    const [startDate, setStartDate] = useState(new Date());
    const [lineXValues, setLineXValues] = useState([])
    const [lineYValues, setLineYValues] = useState([])
    const [barXValues, setBarXValues] = useState([])
    const [approvedValues, setApprovedValues] = useState([])
    const [appliedValues, setAppliedValues] = useState([])
    const [rejectedValues, setRejectedValues] = useState([])
    const [theme,setTheme] =useState('')
    var currentyear = new Date();
    var minyear = new Date("01/01/2021");
    const [selectedYear, setSelectedYear] = useState(new Date())
    useEffect(() => {
        setStartDate(currentyear)
        setSelectedYear(currentyear)
        getCount();
        getUserCountByYear(currentyear.getFullYear());
        let params = {
            year: currentyear.getFullYear()
        }
        getPatentsCountByStatus(params, "month");
        console.log(props.theme);
    }, [])
    useEffect(()=>{
        setTheme(props.theme)
    },[props.theme])
    var data1 = {
        labels: barXValues,
        datasets: [
            {
                label: "Applied",
                backgroundColor: '#144399',
                data: appliedValues
            },
            {
                label: "Approved",
                backgroundColor: '#146F99',
                data: approvedValues
            },
            {
                label: "Rejected",
                backgroundColor: '#149997',
                data: rejectedValues
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                ticks: {
                    color: theme === "dark"?"white":"#858796", // not 'fontColor:' anymore
                    // fontSize: 18,
                    min: 0,
                    max: 100
    
            },
        },
            y: {
                ticks:{
                    color: theme === "dark"?"white":"#858796",
                    suggestedMin: 0,
                    suggestedMax: 10
                }
            },
        },
        plugins: {
            legend:{
                labels:{
                    color: theme === "dark"?"white":"#858796"
                }
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                    threshold: "4",
                },
                zoom: {
                    wheel: {
                        enabled: true
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'x',
                },
                limits: {
                    x: { minRange: 3 }
                }
            }
        }

    };
    const usersdata = {
        labels: lineXValues,
        datasets: [
            {
                label: 'Users ',
                data: lineYValues,
                backgroundColor: [
                    'rgb(138, 174, 240,0.5)'
                ],
                borderColor: [
                    '#144399'
                ],
                borderWidth: 1,
                pointBackgroundColor:'#144399',
                fill:true,
                lineTension:0.3,
                
            },
        ],
    };
    const buttonclick = async (e, type) => {
        try {
            let params;
            if (type === 'day') {
                setIsHour(true);
                params = {
                    month: startDate.getMonth() + 1,
                    year: startDate.getFullYear()
                }
            }
            else {
                setIsHour(false);
                params = {
                    year: startDate.getFullYear()
                }
            }
            getPatentsCountByStatus(params, type)
        } catch (error) {
            console.error("Error", error);
        }
    }

    const getCount = async () => {
        let path = base_url + "admin/statistics"
        await appContext.getAxios().get(path).then((response) => {
            if (response !== undefined && response.status === 200) {
                let data = response.data;
                setApproved(data.approvedPatent);
                setApplied(data.appliedPatent);
                setRejected(data.rejecteddPatent)
                setUserCount(data.userCount)
            }
        }).catch(err => {
            console.log(err);
        })
    }
    const getUserCountByYear = async (year) => {
        var xValues = [];
        var yValues = [];
        let path = base_url + "admin/statistics/user?year=" + year;
        await appContext.getAxios().get(path).then((response) => {
            if (response !== undefined && response.status === 200) {
                let data = response.data;
                for (var obj of data) {
                    xValues.push(monthNames[obj.month - 1]);
                    yValues.push(obj.numberOfUsers)
                }
                setLineXValues(xValues);
                setLineYValues(yValues)

            }
        }).catch(err => {
            console.log(err);
        })
    }
    const getPatentsCountByStatus = async (params, axisType) => {
        var xValues = [];
        var appliedyValues = [];
        var approvedyValues = [];
        var rejectedyValues = [];
        let path = base_url + "admin/statistics/patents";
        await appContext.getAxios().get(path, { params }).then((response) => {
            if (response !== undefined && response.status === 200) {
                let data = response.data;
                for (var obj of data) {
                    if (axisType === "day")
                        xValues.push("Day " + obj.day);
                    else
                        xValues.push(monthNames[obj.month - 1]);
                    appliedyValues.push(obj.counts.applied);
                    approvedyValues.push(obj.counts.approved);
                    rejectedyValues.push(obj.counts.rejected)
                }
                setBarXValues(xValues);
                setAppliedValues(appliedyValues);
                setApprovedValues(approvedyValues)
                setRejectedValues(rejectedyValues)
            }
        }).catch(err => {
            console.log(err);
        })
    }
    const handleChange = (e) => {
        var year = e.getFullYear()
        setSelectedYear(e);
        getUserCountByYear(year)
    }
    const onDateChange = (date) => {
        let params;
        let type = "month";
        setStartDate(date);
        params = {
            year: date.getFullYear()
        }
        if (isHour) {
            type = "day"
            params = {
                month: date.getMonth() + 1,
                year: date.getFullYear()
            }
        }
        getPatentsCountByStatus(params, type)
    }
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return (
        <div className="container  mb-4">
            <Row xs={1} md={2} lg={4} className="g-4">
                <Col>
                    <Card className="overview-item overview-item--c1">
                        <Card.Body style={{ height: "110px" }} className="text-center">
                            <Card.Title>Total Users</Card.Title>
                            <Card.Text className="h2">
                                {userCount}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card className="overview-item overview-item--c2">
                        <Card.Body style={{ height: "110px" }} className="text-center">
                            <Card.Title>Patents Applied</Card.Title>
                            <Card.Text className="h2">
                                {applied}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card className="overview-item overview-item--c3">
                        <Card.Body style={{ height: "110px" }} className="text-center">
                            <Card.Title>Patents Approved</Card.Title>
                            <Card.Text className="h2" >
                                {approved}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card className="overview-item overview-item--c4">
                        <Card.Body style={{ height: "110px" }} className="text-center">
                            <Card.Title>Patents Rejected</Card.Title>
                            <Card.Text className="h2">
                                {rejected}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

            </Row>
            <Row xs={1} md={1} lg={2} className="g-4 mt-2">
                <Col>
                    <Card className="dashCard">
                        <Card.Body>
                            <Card.Title className="mb-5">
                                Patents
                                <div style={{ marginTop: "-24px" }}>
                                    <ButtonGroup style={{ float: "right" }} className="typeBtn">
                                        <Button active={isHour} variant="primary" onClick={e => buttonclick(e, 'day')}>Daily</Button>
                                        <Button active={!isHour} variant="primary" onClick={e => buttonclick(e, 'month')}>Monthly</Button>
                                    </ButtonGroup>
                                    <div className="rangeselect mr-5">
                                        {isHour ? <DatePicker
                                            selected={startDate} minDate={minyear} maxDate={currentyear}
                                            onChange={(date) => onDateChange(date)}
                                            dateFormat="MMM yyyy"
                                            showMonthYearPicker
                                        /> : <DatePicker
                                            selected={startDate} showYearPicker minDate={minyear} maxDate={currentyear}
                                            onChange={(date) => onDateChange(date)}
                                            dateFormat="yyyy" yearItemNumber="10"
                                        />}
                                    </div>
                                </div>
                            </Card.Title>

                            <Card.Text>
                                <Bar data={data1} options={options} height={400} width={"400px"} />
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card className="dashCard">
                        <Card.Body>
                            <Card.Title className="mb-5">Users Registered
                                <div className="yearselect">
                                    <DatePicker
                                        selected={selectedYear} dateFormat="yyyy"
                                        onChange={(date) => handleChange(date)}
                                        showYearPicker minDate={minyear} maxDate={currentyear}
                                        yearItemNumber="10"
                                    />
                                </div>
                            </Card.Title>
                            <Card.Text>
                                <Line data={usersdata} options={options} height={400} width={"400px"} />
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

            </Row>
        </div>
    );
}

export default Dashboard;