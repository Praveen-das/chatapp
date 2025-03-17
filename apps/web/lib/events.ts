export function scrolleToIndexHelper(id:string){
    if(!id) return
    const myEvent = new CustomEvent('myCustomEvent', { detail: { id } });
    document.dispatchEvent(myEvent);
}