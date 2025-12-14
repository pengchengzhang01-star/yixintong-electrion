import { BrowserWindow } from "electron";

import type { RequestInit, Response } from 'node-fetch';

const fetch = (url: string, init?: RequestInit): Promise<Response> =>
    import('node-fetch').then(mod => mod.default(url, init));

const getPlatform = () => {
    if (process.platform === "darwin") {
        return 4;
    }
    if (process.platform === "win32") {
        return 3;
    }
    return 7;
};

export const createOAuthWindow = ({ baseUrl, provider }: { baseUrl: string; provider: string }) => {
    return new Promise((resolve, reject) => {
        const callbackUrl = `openim://oauth/callback`;
        let authUrl = '';
        if (provider === 'google') {
            authUrl = `${baseUrl}/oauth/login/google?cb=${encodeURIComponent(callbackUrl)}`;
        } else if (provider === 'github') {
            authUrl = `${baseUrl}/oauth/login/github?cb=${encodeURIComponent(callbackUrl)}`;
        }

        const authWin = new BrowserWindow({
            width: 500,
            height: 700,
            webPreferences: {
                nodeIntegration: false,
            },
        });
        authWin.loadURL(authUrl);

        authWin.webContents.on('will-redirect', (_, url) => {
            if (url.startsWith(callbackUrl)) {
                const params = new URL(url).searchParams;
                const oauth_state = params.get('oauth_state');
                const oauth_registered = params.get('oauth_registered');
                if (!oauth_state || !oauth_registered) {
                    reject(new Error('Oauth failed'));
                    authWin.close();
                    return;
                }

                const func = oauth_registered === "true" ? oAuthLogin : oAuthRegister;
                func(baseUrl, oauth_state)
                    .then((data) => {
                        resolve(data.data);
                        authWin.close();
                    })
                    .catch((err) => {
                        reject(err);
                        authWin.close();
                    });
            }
        });

        authWin.on('closed', () => {
            reject(new Error('Window closed'));
        });
    });
}

const generateUUID = () => new Date().getTime().toString(36) + Math.random().toString(36).substring(2);

type OAuthLoginResponse = {
    chatToken: string;
    imToken: string;
    userID: string;
}

async function oAuthRegister(baseUrl: string, state: string) {
    const res = await fetch(`${baseUrl}/account/register/oauth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'operationID': generateUUID(),
        },
        body: JSON.stringify({
            state,
            platform: getPlatform(),
        }),
    });

    if (!res.ok) {
        throw new Error(`Register failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return data as { data: OAuthLoginResponse };
}

async function oAuthLogin(baseUrl: string, state: string) {
    const res = await fetch(`${baseUrl}/account/login/oauth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'operationID': generateUUID(),
        },
        body: JSON.stringify({
            state,
            platform: getPlatform(),
        }),
    });

    if (!res.ok) {
        throw new Error(`Login failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return data as { data: OAuthLoginResponse };
}