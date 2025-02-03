let tokenCache = {};

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(["tokenCache"], (data) => {
        tokenCache = data.tokenCache || {};
    });
});

function formatTokenAge(unixTimestamp) {
    if (unixTimestamp > 9999999999) {
        unixTimestamp = Math.floor(unixTimestamp / 1000);
    }

    const now = Math.floor(Date.now() / 1000);
    const diff = now - unixTimestamp;

    if (diff < 60) {
        return `${diff} seconds old`;
    } else if (diff < 3600) {
        return `${Math.floor(diff / 60)} minutes old`;
    } else if (diff < 86400) {
        return `${Math.floor(diff / 3600)} hours old`;
    } else {
        return `${Math.floor(diff / 86400)} days old`;
    }
}

function fetchTokenData(address, sendResponse) {
    if (address.length < 10) {
        fetch(`https://api.dexscreener.com/latest/dex/search?q=${address}&chainId=solana`)
            .then(response => response.json())
            .then(data => {
                try {
                    if (data.pairs && data.pairs.length > 0) {
                        fetchTokenData(data.pairs[0].baseToken.address, sendResponse);
                        return;
                    }
                } catch(error) {
                    sendResponse({ error: "Not a token address: " + address + "\n" + error.message});
                }
            })
        return;
    }

    try {
        if (chrome.storage.local.has('tokenCache')) {
            if (chrome.storage.local.get('tokenCache').has(address)) {
                let tokenData = chrome.storage.local.get('tokenCache')[address];
                let fetchAt = tokenData.fetchAt;
                let diff = new Date() - fetchAt;
                if (diff / 1000 <= 30) {
                    sendResponse(tokenData);
                }
            }

        }
    } catch (error){}

    fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
        .then(response => response.json())
        .then(data => {
            try {
                if (data.pairs && data.pairs.length > 0) {
                    let token = data.pairs[0];
                    //if (address.length < 10) {
                        let idx = 0;
                        for (let idx = 0; idx < data.pairs.length; idx++) {
                            //exact match address
                            if (data.pairs[idx].baseToken.baseToken === address) {
                                token = data.pairs[idx];
                                break;
                            }
                            //exact match symbol
                            if (data.pairs[idx].baseToken.symbol === address) {
                                token = data.pairs[idx];
                                break;
                            }
                        }

                    //}

                    let newMarketCap = token.fdv ? parseFloat(token.fdv) : null;
                    let website = "";
                    let twitter = "";
                    let telegram = "";


                    if (token.info && Array.isArray(token.info.websites) && token.info.websites.length > 0) {
                        website = token.info.websites[0].url;
                    }

                    if (token.info && Array.isArray(token.info.socials) && token.info.socials.length > 0) {
                        token.info.socials.forEach((element) => {
                            if (element.type === "twitter") {
                                twitter = element.url;
                            }
                            if(element.type === "telegram") {
                                telegram = element.url;
                            }
                        })
                    }

                    const tokenData = {
                        symbol: token.baseToken.symbol,
                        price: parseFloat(token.priceUsd).toFixed(9),
                        marketCap: newMarketCap ? newMarketCap.toLocaleString() : 'N/A',
                        chartUrl: `https://dexscreener.com/solana/${address}`,
                        swapUrl: `https://jup.ag/swap/SOL-${address}`,
                        change: token.priceChange.m5 > 0 ? '⬆️' : '⬇️',
                        priceChange: token.priceChange,
                        website: website,
                        twitter: twitter,
                        telegram: telegram,
                        volume: token.volume,
                        age: formatTokenAge(token.pairCreatedAt),
                        chainId: token.chainId,
                        fetchAt: new Date()
                    };
                    tokenCache[address] = tokenData;
                    chrome.storage.local.set({ "tokenCache": tokenCache });
                    sendResponse(tokenData);
                } else {
                    sendResponse({ error: "Not a token address: " + address });
                }
            }catch(error) {
                sendResponse({error: error.message});
            }
        })
        .catch(() => sendResponse({ error: "Error fetching token data." }));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchTokenData") {
        fetchTokenData(request.address, sendResponse);
        return true;
    }
});

/*
setInterval(() => {
    Object.keys(tokenCache).forEach(address => {
        fetchTokenData(address, () => {});
    });
}, 60000);
/**
 */
