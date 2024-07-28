// import imagekit from './ImageKit';

// function isObjectURL(url) {
//     var objUrl = new URL(url);
//     return objUrl.protocol === 'blob:';
// }

// export function uploadImages(images, callback = () => null) {
//     const individualProgress = {};
//     let totalSize = 0;

//     const handleProgress = (e, i) => {
//         individualProgress[i] = e.loaded;
//         let uploaded = Object.values(individualProgress).reduce((x, y) => x + y);

//         callback(~~((uploaded / totalSize) * 100));
//     };

//     return Promise.all(
//         images.map(async (image, i) => {
//             if (!isObjectURL(image.url)) return image;
//             let qString = '?' + new Date().getTime();

//             let imgData = await fetch(image.url).then(res => res.blob());
//             totalSize += imgData.size;
//             const customXHR = new XMLHttpRequest();

//             customXHR.upload.onprogress = (e) => handleProgress(e, i);

//             return imagekit.upload({
//                 xhr: customXHR,
//                 file: imgData,
//                 fileName: image.name,
//                 overwriteFile: true,
//                 useUniqueFileName: false
//             })
//                 .then((res) => (
//                     {
//                         ...res,
//                         uid: image.uid,
//                         url: res.url + qString,
//                         thumbnailUrl: res.thumbnailUrl + qString
//                     }))
//                 .catch(err => console.log(err));
//         }));
// }

export function uploadImages(images:any, callback = () => null) {
    // const individualProgress = {};
    // let totalSize = 0;

    // const handleProgress = (e, i) => {
    //     individualProgress[i] = e.loaded;
    //     let uploaded = Object.values(individualProgress).reduce((x, y) => x + y);

    //     callback(~~((uploaded / totalSize) * 100));
    // };

    // return Promise.all(
    //     images.map(async (image, i) => {
    //         if (!isObjectURL(image.url)) return image;
    //         let qString = '?' + new Date().getTime();

    //         let imgData = await fetch(image.url).then(res => res.blob());
    //         totalSize += imgData.size;
    //         const customXHR = new XMLHttpRequest();

    //         customXHR.upload.onprogress = (e) => handleProgress(e, i);

    //         return imagekit.upload({
    //             xhr: customXHR,
    //             file: imgData,
    //             fileName: image.name,
    //             overwriteFile: true,
    //             useUniqueFileName: false
    //         })
    //             .then((res) => (
    //                 {
    //                     ...res,
    //                     uid: image.uid,
    //                     url: res.url + qString,
    //                     thumbnailUrl: res.thumbnailUrl + qString
    //                 }))
    //             .catch(err => console.log(err));
    //     }));
}