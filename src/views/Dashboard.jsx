import React,{useState,useEffect} from 'react';
import { Table } from 'antd';
import {formatBigNum} from '../Variables'
const fetchOverviewData=(changeInterval)=>{
    let str= (changeInterval===1?'ohlcv_last_1_hour':'ohlcv_last_24_hour');

    return  fetch('https://data.messari.io/api/v2/assets?fields=id,slug,symbol,metrics/market_data/price_usd,metrics/market_data/'+str)
        .then(response => response.json())
        .then(response=>{
            return response;
        })
}



const formatTable=(raw)=>{
    let rows=[],columns=[],nameList=[];
    if(raw && raw.data&& Array.isArray(raw.data))
    {
        for(let item of raw.data)
        {
            let {metrics,...rest}=item;
            let {ohlcv_last_1_hour,ohlcv_last_24_hour,...rest2}=metrics.market_data;

            let market=(ohlcv_last_24_hour?ohlcv_last_24_hour:ohlcv_last_1_hour)
            let changeNum=(market.close-market.open)/market.open;
            let volumeStr=formatBigNum(market.volume);
            let change=(changeNum<0?'-':'')+(Math.abs(changeNum)*100).toFixed(2)+'%';

            rows.push({volumeStr,...rest,change,changeNum,...market,...rest2});
            nameList.push({slug:rest.slug,symbol:rest.symbol});
        }
        let tmpColumn=['symbol','change','price_usd','volumeStr'];
        columns=tmpColumn.map(item=>{
            let dataIndex=item,key=item,title=item;
            switch(item) {
                case 'volumeStr':
                    title='volume';
                    break;
                case 'change':
                    title='24h Change';
                    break;
                case 'price_usd':
                    title='price (USD)';
                    break;
                default:
                    break
            }
            return{dataIndex,key,title,
                sorter: (a, b) =>(a[item] > b[item]?1:-1),
                render:(text,record)=>{
                    if(typeof text ==='number') text=text.toFixed(4);
                    if(item==='change'){
                        return <div className={record.changeNum<0?'bearish-cell':'bullish-cell'}>{text}</div>
                    }
                    return <div className={'normal-cell'}>{text}</div>
                } };
        })
    }
    return{rows,columns,nameList}
}
function DashboardView(props) {
    const [columns,setColumns]=useState([]);
    const [data,setData]=useState([]);
    useEffect(()=>{
        processData();
        const timer = setInterval(() => {
            processData();
        }, 5000);
        return () => clearInterval(timer);
    },[]);

    const processData=()=>{
        fetchOverviewData(24).then(response=>{
            let tableData=formatTable(response);
            if(!localStorage.getItem('coinList'))
                localStorage.setItem('coinList',JSON.stringify(tableData.nameList))
            setData(tableData.rows);
            setColumns(tableData.columns);
        });
    }
    const clickRow=(row)=>{
        props.history.push('/coinhistory',{firstCoin:row,fullList:data});
        props.clickSub();
    }

    return(
        <div style={{height:'100%'}}>
            <h1>Coins Overview</h1>
            <Table columns={columns} dataSource={data}  rowKey={record => record.id} onRow={(record) => ({onClick:(e)=>clickRow(record)})}/>
        </div>
    )
}

export default DashboardView;