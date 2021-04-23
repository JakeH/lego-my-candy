// https://docs.streamelements.com/reference/overlays

import axios, { AxiosInstance } from 'axios';
import jwt_decode from 'jwt-decode';
import { getCurrentSettings } from '../settings/settings';
import { OverlayInfo } from './stream-elements.models';

interface StreamElementsJWT {
    user: string;
    role: string;
    channel: string;
    provider: string;
    authToken: string;
    iat: number;
    iss: string;
}

// seems that the structure of the SE url is base/action/channel
type APIAction = 'overlays' | 'sessions';

const baseUrl = 'https://api.streamelements.com/kappa/v2';

let instance: AxiosInstance;

function getInstance(action: APIAction): AxiosInstance {

    if (instance) {
        return instance;
    }

    const { streamElements } = getCurrentSettings();

    // stream elements requires us to use the internal channel id, 
    // which we can find in our JWT
    const parsed = jwt_decode(streamElements.token) as StreamElementsJWT;

    const url = `${baseUrl}/${action}/${parsed.channel}`;
    const inst = axios.create({
        baseURL: url,
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${streamElements.token}`,
        },
    });

    // inst.interceptors.request.use(request => {
    //     console.log('Starting Request', request);
    //     return request;
    // });

    // inst.interceptors.response.use(response => {
    //     console.log('Response:', response.data);
    //     return response;
    // });

    instance = inst;

}

/**
 * Returns the list of registered overlays for the channel
 */
export async function getOverlays(): Promise<OverlayInfo[]> {
    return getInstance('overlays').get('').then(o => o.data.docs);
}

export async function getOverlay(id: string): Promise<OverlayInfo> {
    return getInstance('overlays').get(id).then(o => o.data);
}

export async function activateOverlay() {
    return getInstance('overlays').put('action');
}
