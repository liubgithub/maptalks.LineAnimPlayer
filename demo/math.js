//数学计算相关
var math = {};
math.disposeNumber=function(value){
    if(value == null || value == ""){
        return 0;
    }else if(value.toString().indexOf(".") == -1){
        return value;
    }else{
        return this.round(value, 2);
    }
}
math.round=function(v,e){
    var t=1;
    for(;e>0;t*=10,e--);
    for(;e<0;t/=10,e++);
    return Math.round(v*t)/t;
}