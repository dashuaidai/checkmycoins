export const formatBigNum = n => {
    if (n < 1e3) return n;
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
    if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
};
export const getCoinList=()=>{
    let tmpListStr=localStorage.getItem('coinList')
    if(tmpListStr)
    {
        let fullList=JSON.parse(tmpListStr).map(item=>({label:item.slug,value:item.symbol}))
       return fullList;
    }
    return null
}

export function calculateMA(dayCount, data) {
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