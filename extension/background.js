let tokenCache = {};
let blacklist = new Set();
let marketCapHistory = {};

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(["tokenCache", "blacklist", "marketCapHistory"], (data) => {
        tokenCache = data.tokenCache || {};
        blacklist = new Set(data.blacklist || []);
        marketCapHistory = data.marketCapHistory || {};
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
    if (blacklist.has(address)) {
        sendResponse({ error: "Not a token address" });
        return;
    }

    fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
        .then(response => response.json())
        .then(data => {
            try {
                if (data.pairs && data.pairs.length > 0) {
                    const token = data.pairs[0];
                    const newMarketCap = token.fdv ? parseFloat(token.fdv) : null;
                    let marketCapChange = "";
                    let website = "";
                    let twitter = "";
                    let telegram = "";


                    if (marketCapHistory[address] !== undefined && newMarketCap !== null) {
                        if (newMarketCap > marketCapHistory[address]) {
                            marketCapChange = "📈";
                        } else if (newMarketCap < marketCapHistory[address]) {
                            marketCapChange = "📉";
                        }
                    }

                    if (token.info.websites !== undefined && token.info.websites.length > 0) {
                        website = token.info.websites[0].url;
                    }

                    if (token.info.socials !== undefined && token.info.socials.length > 0) {
                        token.info.socials.forEach((element) => {
                            if (element.type === "twitter") {
                                twitter = element.url;
                            }
                            if(element.type === "telegram") {
                                telegram = element.url;
                            }
                        })
                    }

                    marketCapHistory[address] = newMarketCap;
                    chrome.storage.local.set({ "marketCapHistory": marketCapHistory });

                    const tokenData = {
                        symbol: token.baseToken.symbol,
                        price: parseFloat(token.priceUsd).toFixed(9),
                        marketCap: newMarketCap ? newMarketCap.toLocaleString() + " " + marketCapChange : 'N/A',
                        chartUrl: `https://dexscreener.com/solana/${address}`,
                        swapUrl: `https://jup.ag/swap/SOL-${address}`,
                        change: token.priceChange.m5 > 0 ? '⬆️' : '⬇️',
                        website: website,
                        twitter: twitter,
                        telegram: telegram,
                        volume: token.volume,
                        age: formatTokenAge(token.pairCreatedAt)
                    };
                    tokenCache[address] = tokenData;
                    chrome.storage.local.set({ "tokenCache": tokenCache });
                    sendResponse(tokenData);
                } else {
                    blacklist.add(address);
                    chrome.storage.local.set({ "blacklist": [...blacklist] });
                    sendResponse({ error: "Not a token address:" + address });
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

setInterval(() => {
    Object.keys(tokenCache).forEach(address => {
        fetchTokenData(address, () => {});
    });
}, 60000);
