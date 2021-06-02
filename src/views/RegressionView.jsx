import React,{useState,useEffect} from 'react';
import ReactECharts from 'echarts-for-react';
import moment from 'moment';
import {Radio, Select} from 'antd';
import {formatBigNum,getCoinList,calculateMA} from '../Variables'
import * as echarts from 'echarts/core';
import ecStat from 'echarts-stat';
echarts.registerTransform(ecStat.transform.regression);
const EventsDict={
    'click': (param, echarts)=>{
        console.log(param, echarts);
    },
}
const coinTypesShort=[{label:'Bitcoin',value:'btc'},{label:'Ethereum',value:'eth'},{label:'Doge',value:'doge'}];

const fetchAllData=(options)=>{
    let {type}=options;
    let end= moment().format('YYYY-MM-DD');

    return  fetch('https://data.messari.io/api/v1/assets/'+type+'/metrics/price/time-series?start=2012-07-30&end='+end)
        .then(response => response.json())
        .then(response=>{
            let ma200=calculateMA(30,response.data.values)
            let values=response.data.values.map((item,idx)=>{
                let timestamp=item[0];
                let time=moment(timestamp).utc(true).format('YY/MM/DD HH:mm:ss');
                let life=Math.floor((timestamp-moment('2012-07-30','YYYY-MM-DD').valueOf())/1000/60/60/24);
                let price=item[1],volume=item[5],logPrice=Math.log10(price);
                let newItem=[life,price,logPrice,volume,ma200[idx],time,timestamp]
                return newItem;
            });

            let columns=['life','price','logPrice','volume','ma200','time','timestamp'];
            console.log(values);
            return {values,columns}

        })
}

function RegressionView(props) {
    const [coin,setCoin]=useState(coinTypesShort[0]);
    const [coinTypes,setCoinTypes]=useState([...coinTypesShort]);
    const [regression,setRegression] = useState('p3')
    const [ahr,setAHR] = useState(null)
    const chartToolTip=(params)=>{
        let result ='<div class="chart-tooltip">';
        result+=params[0].value[5] ;
        result+='<br>';
        let val=[];
        for(let id in params)
        {
            let param=params[id];
            result+=param.marker;
            result+=param.seriesName+': ';
            let yid=param.encode.y[0];
            let value=param.value[yid]
            result+=value.toFixed(4);
            result+='<br>';
            val.push(value);
            if(id==='2'&&param.value[yid+1])
            {
                result+=param.value[yid+1]
                result+='<br>';
            }
        }
        let ahr99=val[0]*val[0]/(val[1]*val[2]);
        result+='Ahr99: ' + ahr99.toFixed(2);
        setAHR(ahr99);
        result+='<br>';
        result+='</div>';
        return result
    };
    const [options,setOptions]=useState({
        grid: [
            { top: '20%', right: 80, left: 64, height: '45%' },
        ],
        dataset:[{source:[],dimensions:[]},
            { transform: {  type: 'ecStat:regression', config: { method: 'polynomial', order: 3} }},
        ],
        series:[
            {type:'line',name:'Price',symbol:'circle', encode:{x:'life',y:['price']}},
            {type:'line',name:'MA 200',symbol:'circle', encode:{x:'life',y:['ma200']}},
            { name: 'Polynomial Regression (o3)', type: 'line',symbol:'circle', datasetIndex: 1, symbolSize: 0.1, label: { show: true, fontSize: 16 },  labelLayout: { dx: -20 }, encode: { label: 2, tooltip: 1 } },
        ],
        legend:{show: true,top:0},
        yAxis: [
            { type: 'value', scale:true, splitArea: { show: true }, name:'Price $' },
        ],
        xAxis:[
            { type: 'value', name:'Age (days)', scale: true},
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
        processData(newCoin);
        const timer = setInterval(() => {
            processData(coin);
        }, 1000*60*30);
        return () => clearInterval(timer);
    },[]);

    const processData=(tmpCoin)=>{
        let type=tmpCoin.value;
        fetchAllData({type}).then(response=>{
            let def=getRegressionDefine(regression);
            setOptions(prev=>{
                let newOpt={...prev};
                newOpt.dataset=[
                    { 'dimensions':response.columns, 'source':[...response.values] },
                    { transform: def.transform}
                ]
                newOpt.series[0].encode.tooltip=response.columns;
                newOpt.series[2]= { name:def.name, type: 'line',symbol:'circle', datasetIndex: 1, symbolSize: 0.1, label: { show: true, fontSize: 16 },  labelLayout: { dx: -20 }, encode: { label: 2, tooltip: 1 } };

                let tmpColumn=[...response.columns]
                let valueAxis=tmpColumn.splice(1,tmpColumn.length-2);
                newOpt.series[0].encode.tooltip=[...valueAxis];

                return newOpt;
            })
        })
    }


    function onChange(value,item) {
        setCoin(item);
        setAHR(null);
        processData(item);
    }

    const filterOptions=(input, tmp) => {
        return (tmp.value+tmp.label).toLowerCase().indexOf(input.toLowerCase()) >= 0
    }
    const getRegressionDefine=(value)=>{
        let name='Polynomial Regression (o3)',datasetIndex=2,transform={  type: 'ecStat:regression', config: { method: 'polynomial', order: 3 } };

        switch (value) {
            case 'p2':
                name='Polynomial Regression (o2)';
                transform={  type: 'ecStat:regression', config: { method: 'polynomial', order: 2 } };
                datasetIndex=1;
                break;
            case 'p4':
                name='Polynomial Regression (o4)';
                transform={  type: 'ecStat:regression', config: { method: 'polynomial', order: 4 } };
                datasetIndex=3;
                break;
            case 'lg':
                name='Logarithmic Regression';
                transform= {  type: 'ecStat:regression', config: { method: 'logarithmic'} }
                datasetIndex=4;
                break;
            case 'ep':
                name='Exponential Regression';
                transform= {  type: 'ecStat:regression', config: { method: 'exponential'} }
                datasetIndex=5;
                break;
            case 'ln':
                name='Linear Regression';
                transform= {  type: 'ecStat:regression' }
                datasetIndex=6;
                break;
        }
        return {name,datasetIndex:datasetIndex,transform}
    }
    const onChangeRegression=(e)=>{
        setRegression(e.target.value);
        setAHR(null);
        let def=getRegressionDefine(e.target.value);
        setOptions(prev=>{
            let newOpt={...prev};
            newOpt.series=[...prev.series];
            newOpt.dataset[1]={transform: def.transform}
            newOpt.series[2]= { name:def.name, type: 'line',symbol:'none', datasetIndex: 1, symbolSize: 0.1, label: { show: true, fontSize: 16 },  labelLayout: { dx: -20 }, encode: { label: 2, tooltip: 1 } };
            return newOpt;
        })
    }

    return(
        <div style={{height:'100%', width: '100%'}}>
            <h2 className={'chart-title'}> {coin.label+' Life VS Price (USD)'}</h2>
            <h3>AHR99: {ahr?ahr.toFixed(2):''}</h3>
            <h4>If Ahr99 &#60; 0.65 All In, else if Ahr99 &#60; 1.2 Start Fix Investment</h4>
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
            <Radio.Group defaultValue={regression} size="small" optionType="button" onChange={onChangeRegression}>
                <Radio.Button value={'p2'}>Polynomial O2</Radio.Button>
                <Radio.Button value={'p3'}>Polynomial O3</Radio.Button>
                <Radio.Button value={'p4'}>Polynomial O4</Radio.Button>
                <Radio.Button value={'lg'}>Logarithmic</Radio.Button>
                <Radio.Button value={'ep'}>Exponential</Radio.Button>
                <Radio.Button value={'ln'}>Linear</Radio.Button>
            </Radio.Group>
        </div>
    )
}

export default RegressionView;