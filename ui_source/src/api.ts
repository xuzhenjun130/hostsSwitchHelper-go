import request from 'umi-request';

const baseUrl =
  process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:8011/';

export const getConfig = async () => {
  return await request(baseUrl + 'getConfig');
};

export const getHosts = async () => {
  return await request(baseUrl + 'getHosts');
};

export const delConfig = async (id: string) => {
  return await request(baseUrl + 'delConfig', {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    data: 'id=' + id,
  });
};

export const addConfig = async (data: any) => {
  //读取url
  if(data.ip.indexOf("http")>=0){
     data.hosts =  data.name + "\n" + await request(data.ip);
  }
  return await request(baseUrl + 'addConfig', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data: data,
  });
};


export const updateConfig = async (data: any) => {
  //读取url
  if(data.ip.indexOf("http")>=0){
    data.hosts =  data.name + "\n" + await request(data.ip);
 }
  return await request(baseUrl + 'updateConfig', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    data: data,
  });
};
