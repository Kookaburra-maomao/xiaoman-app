import { get } from '@/utils/request';
import { useEffect, useState } from 'react';
/**
 * 
 * @param {*} url 
 * @param {*} params 
 * @returns {{
 *      data: Object,
 *      loading: boolean,
 *      error: boolean,
 * }}
 */
const useFetchData = (url, params = {}) => {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const fetchData = async () => {
        try {
            const { data } = await get(url, params);
            setData(data);
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, [url, JSON.stringify(params)]);
    return { data, loading, error, setData };
}
export default useFetchData;