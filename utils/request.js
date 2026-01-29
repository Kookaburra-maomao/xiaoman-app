import urlcat from 'urlcat';

// 最后请求时间存储（使用全局变量，避免频繁读写 AsyncStorage）
let lastRequestTime = Date.now();

// 更新最后请求时间的回调函数（由 AuthContext 设置）
let onRequestCallback = null;

// 设置请求回调函数
export const setRequestCallback = (callback) => {
    onRequestCallback = callback;
};

// 获取最后请求时间
export const getLastRequestTime = () => lastRequestTime;

const request = async (url, { method = 'GET', params, body } = {}) => {
    const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL;
    const requestUrl = urlcat(apiUrl, url, params);

    // 更新最后请求时间
    lastRequestTime = Date.now();
    
    // 通知 AuthContext 有新的网络请求
    if (onRequestCallback) {
        onRequestCallback(lastRequestTime);
    }

    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };
    const config = {
        method,
        headers,
        credentials: 'include',
        ...(body && { body: JSON.stringify(body) }),
    };
    const response = await fetch(requestUrl, config);
    if (!response.ok) {
        const {message, errors} = await response.json().catch(() => null);
        const error = new Error(message);
        error.status = response.status;
        error.errors = errors;
        throw error;
    }
    return await response.json();
}

export default request;

export const get = (url, params) => request(url, { method: 'GET', params });
export const post = (url, body) => request(url, { method: 'POST', body });
export const put = (url, body) => request(url, { method: 'PUT', body });
export const del = (url, params) => request(url, { method: 'DELETE', params });