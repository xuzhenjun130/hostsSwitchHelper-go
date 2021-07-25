// register-service-worker.js
import { register } from 'register-service-worker';

function dispathServiceWorkerEvent(eventName: string) {
  const event = document.createEvent('Event');
  event.initEvent(eventName, true, true);
  window.dispatchEvent(event);
}

if (process.env.NODE_ENV === 'production') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ',    registration.scope);
    }).catch(function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  }
  // register(`/sw.js`, {
  //   // 这个路径是根据你最终生成的 service worker 的文件路径来确定
  //   updated() {
  //     dispathServiceWorkerEvent('sw.updated');
  //   },

  //   offline() {
  //     dispathServiceWorkerEvent('sw.offline');
  //   },
  // });
}
