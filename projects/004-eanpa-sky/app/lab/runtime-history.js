export function appendBounded(items,value,limit){
 items.push(value);const dropped=Math.max(0,items.length-limit);if(dropped)items.splice(0,dropped);return dropped;
}
