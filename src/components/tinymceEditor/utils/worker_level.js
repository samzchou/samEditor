

const _fun = {
    performHeavyCalculation(data) {
        console.log('performHeavyCalculation===>', data);
        return true;
    }
}


self.onmessage = function(event) {
    const data = event.data;
    debugger
    const result = _fun.performHeavyCalculation(data);
    self.postMessage(result);
};
