import React,{useState,useEffect} from 'react';
import ReactECharts from 'echarts-for-react';
import moment from 'moment';
import { Radio,Select} from 'antd';
import {formatBigNum,getCoinList} from '../Variables'

const EventsDict={
    'click': (param, echarts)=>{
        console.log(param, echarts);
    },
}
const coinTypesShort=[{label:'Bitcoin',value:'btc'},{label:'Ethereum',value:'eth'},{label:'Doge',value:'doge'}];
const chartToolTip=(params)=>{
    let result ='<div class="chart-tooltip">'+ params[0].name;
    result+='<br>';
    for(let param of params)
    {

        if(Array.isArray(param.data))
        {
            for(let id in param.data)
            {
                if(param.dimensionNames[id]!=='time'&&param.dimensionNames[id]!=='timestamp'){

                    let sub = param.data[id];
                    if(param.dimensionNames[id]==='volume'){
                        sub=formatBigNum(sub);
                    }
                    else if(typeof (sub)==='number')
                        sub=sub.toFixed(4);
                    result+=param.marker;
                    result+=param.dimensionNames[id]+': ';
                    result+=sub;
                    result+='<br>';
                }

            }
        }else{
            let data=param.data;
            result+=param.marker;
            result+=param.seriesName+': ';
            result+=data;
            result+='<br>';
        }


    }

    result+='</div>';
    return result
};

function calculateMA(dayCount, data) {
    let result = [];
    for (let i = 0, len = data.length; i < len; i++) {
        let realDay=dayCount
        if (i < dayCount) {
            //result.push('-');
            realDay=i+1;
            //continue;
        }
        let sum = 0;
        for (let j = 0; j < realDay; j++) {
            sum += data[i - j][1];
        }
        result.push(+(sum / realDay).toFixed(5));
    }
    return result;
}
const fetchHistorical=(options)=>{
    let {start,end,type}=options;
    let endStr=''
    if(end) endStr='&end='+end;

    return  fetch('https://data.messari.io/api/v1/assets/'+type+'/metrics/price/time-series?start='+start+endStr)
        .then(response => response.json())
        .then(response=>{
        let values=response.data.values.map(item=>{
            let time=moment(item[0]).utc(true).format('YY/MM/DD HH:mm:ss');
            let newItem=[...item]
            newItem.push(time);
            return newItem;
        });
        let columns=response.data.parameters.columns;
        columns.push('time');
        let ma5=calculateMA(5,values);
        let ma10=calculateMA(10,values);
        let ma30=calculateMA(30,values);
        return {values,columns,ma5,ma10,ma30}

    })
}

function PriceView(props) {
    const [days,setDays]=useState(3);
    const [coin,setCoin]=useState(coinTypesShort[0]);
    const [coinTypes,setCoinTypes]=useState([...coinTypesShort]);

    const [options,setOptions]=useState({
        grid: [
            { top: '20%', right: 64, left: 64, height: '45%' },
            { top: '70%', right: 64, left: 64,  height: '20%' }],
        dataset:{source:[],dimensions:[]},
        series:[
            {type:'candlestick',name:'Price',
                itemStyle:{color:'#518f4f',color0:'#c23531',borderColor:'#518f4f',borderColor0:'#c23531'},
                encode:{x:'time',y:['open', 'close', 'high', 'low']}},
            { name: 'MA5', type: 'line', data:[], smooth: true, lineStyle: { opacity: 0.8 }},
            { name: 'MA10', type: 'line', data:[], smooth: true, lineStyle: { opacity: 0.8 }},
            { name: 'MA30', type: 'line', data:[], smooth: true, lineStyle: { opacity: 0.8 }},
            { name: 'Volume', type: 'bar', xAxisIndex: 1, yAxisIndex: 1,encode:{x:'time',y:['volume']},itemStyle:{color:'#cbb0e3'}}
        ],
        legend:{show: true,top:0},
        yAxis: [
            { type: 'value', scale:true, splitArea: { show: true }, name:'Price $' },
            { type: 'value', scale: true,  gridIndex: 1, axisLabel: {show: false}, axisLine: {show: false}, axisTick: {show: false}, splitLine: {show: false} }
        ],
        xAxis:[
            { type: 'category', name:'Time', scale: true},
            {type: 'category', gridIndex: 1, scale: true,  axisLine: {onZero: false}, axisTick: {show: false}, splitLine: {show: false}, axisLabel: {show: false}, }
        ],
        tooltip: {
            trigger: 'axis',
            axisPointer: {type: 'cross'},
            formatter : chartToolTip
        },
        dataZoom:[ {type: 'inside',xAxisIndex: [0,1]}]
    });

    useEffect(()=>{
        let newCoin={...coin};
        let tmpList=getCoinList();
        if(tmpList)
        {
            setCoinTypes([...tmpList]);
        }
        if(props.history.location.state)
        {
            let first=props.history.location.state.firstCoin;
            newCoin={label:first.slug,value:first.symbol};
            setCoin( {...newCoin})
        }
        processData(days,newCoin);
        const timer = setInterval(() => {
            processData(days,coin);
        }, 1000*60*30);
        return () => clearInterval(timer);
    },[]);

    const processData=(tmpDays,tmpCoin)=>{
        let start='2011-01-01',end=null,type=tmpCoin.value;
        switch (tmpDays) {
            case 3:
                start=moment().subtract(3,'days').format('YYYY-MM-DD');
                break;
            case 7:
                start=moment().subtract(1,'weeks').format('YYYY-MM-DD');
                break;
            case 31:
                start=moment().subtract(1,'months').format('YYYY-MM-DD');
                end=moment().format('YYYY-MM-DD');
                break;
            default:
                end=moment().format('YYYY-MM-DD')

        }
        fetchHistorical({type,start,end}).then(response=>{

            setOptions(prev=>{
                let newOpt={...prev};

                newOpt.dataset={
                    'dimensions':response.columns,
                    'source':[...response.values]
                }
                newOpt.series[0].encode.tooltip=response.columns;
                let tmpColumn=[...response.columns]
                let valueAxis=tmpColumn.splice(1,tmpColumn.length-2);
                newOpt.series[0].encode.tooltip=[...valueAxis];
                newOpt.series[1].data=response.ma5;
                newOpt.series[2].data=response.ma10;
                newOpt.series[3].data=response.ma30;
                return newOpt;
            })
        })
    }

    const onChangeDays=(e)=>{
        setDays(e.target.value);
        processData(e.target.value,coin);
    }
    function onChange(value,item) {
        setCoin(item);
        processData(days,item);
    }

    const filterOptions=(input, tmp) => {
        return (tmp.value+tmp.label).toLowerCase().indexOf(input.toLowerCase()) >= 0
    }
    return(
        <div style={{height:'100%', width: '100%'}}>
            <h2 className={'chart-title'}> {coin.label+' Historical Price (USD)'}</h2>
            <Select
                showSearch
                style={{ width: 200 ,margin:16}}
                placeholder="Select a coin"
                optionFilterProp="children"
                options={coinTypes}
                onChange={onChange}
                filterOption={filterOptions}
            >
            </Select>
            <ReactECharts
                option={options}
                style={{height: 500, width: '100%'}}
                notMerge={false}
                lazyUpdate={false}
                onEvents={EventsDict}
            />

                <Radio.Group defaultValue={days} size="large" optionType="button" onChange={onChangeDays}>
                    <Radio.Button value={3}>3 Days</Radio.Button>
                    <Radio.Button value={7}>1 Week</Radio.Button>
                    <Radio.Button value={31}>1 Month</Radio.Button>
                    <Radio.Button value={1000}>All</Radio.Button>
                </Radio.Group>

        </div>
    )
}

export default PriceView;