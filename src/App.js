import React, {useState} from 'react';
import './App.css';
import PriceView from "./views/PriceView";
import DashboardView from "./views/Dashboard";
import {BrowserRouter, Switch, Route,Link} from 'react-router-dom';
import { HomeOutlined, StockOutlined, ExperimentOutlined} from '@ant-design/icons';
import {Menu} from 'antd';
import RegressionView from "./views/RegressionView";

function App() {
    const [current, setCurrent] = useState('/');
    const handleClick=(e)=>{
        setCurrent(e.key)
    }
    const clickSub=(e)=>{
        setCurrent('/coinhistory')
    }
    return (
        <BrowserRouter>
            <div className="App">
                <Menu onClick={handleClick} selectedKeys={[current]} mode="horizontal">
                    <Menu.Item key="/" icon={<HomeOutlined />}>
                        <Link to="/">Home</Link>
                    </Menu.Item>
                    <Menu.Item key="/coinhistory" icon={<StockOutlined />}>
                        <Link to="/coinhistory">Price</Link>
                    </Menu.Item>
                    <Menu.Item key="/regression" icon={<ExperimentOutlined />}>
                        <Link to="/regression">Regression</Link>
                    </Menu.Item>
                </Menu>
                <Switch>
                    <Route path={'/'} exact render={(routeProps) => <DashboardView {...routeProps}  clickSub={clickSub} />}/>
                    <Route path={'/dashboard'} render={(routeProps ) => <DashboardView {...routeProps} clickSub={clickSub} />}/>
                    <Route path={'/coinhistory'} component={PriceView}/>
                    <Route path={'/regression'} component={RegressionView}/>
                </Switch>
            </div>
        </BrowserRouter>
    );
}

export default App;
