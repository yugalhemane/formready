import config from'../site.config.json';export{config};export const adsenseClient=import.meta.env.VITE_ADSENSE_CLIENT||config.adsensePublisherId||'';
