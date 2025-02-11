let tokenCache = {};
let baseTokenCache = {};

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(["tokenCache", "baseTokenCache"], (data) => {
        tokenCache = data.tokenCache || {};
        baseTokenCache = data.baseTokenCache || {};
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

async function updateBaseTokenInfos() {
    const response = await fetch(
        "https://min-api.cryptocompare.com/data/top/mktcapfull?tsym=USD&limit=100"
    );
    const data = await response.json();
    baseTokenCache = data.Data;
    if (chrome.storage.local) {
        chrome.storage.local.set({"baseTokenCache": baseTokenCache});
    }
}

function getBaseTokenInfo(matchedToken) {
    try {
        if (matchedToken.charAt(0) == '$') {
            matchedToken = matchedToken.substring(1).toLowerCase();
        }

        if (!baseTokenCache) {
            return false;
        }
       
        let token = false;
        for(let i = 0; i < baseTokenCache.length; i++) {
            let item = baseTokenCache[i];
            if (item?.CoinInfo?.Internal?.toLowerCase() === matchedToken.toLowerCase()) {
                token = item;
                break;
            }
        }
        
        return token
            ? {
                priceUSDC: token.RAW.USD.PRICE,
                marketCap: token.RAW.USD.MKTCAP,
                symbol: token.RAW.USD.FROMSYMBOL,
                id: token.CoinInfo.Internal,
                priceChange: token.RAW.USD.CHANGEPCTHOUR,
                priceChangeHour: token.RAW.USD.CHANGEPCTHOUR,
                volume: {h1: token.RAW.USD.VOLUMEHOUR, m5: Math.floor(token.RAW.USD.VOLUMEHOUR / 12)}
            }
            : false;
    } catch (error) {
        console.error("Error fetching token data:", error);
        return false;
    }
}

// Example Usage:
//getTokenInfo("$SOL").then(console.log); 
// Output: { priceUSDC: 98.5, marketCap: 41000000000, symbol: "SOL" } OR false


async function fetchTokenData(address, sendResponse) {
    updateBaseTokenInfos();

    if (address.length < 10) {
        let baseToken = getBaseTokenInfo(address);
        if (baseToken) {
            const tokenData = {
                symbol: baseToken.symbol,
                price: parseFloat(baseToken.priceUSDC).toFixed(9),
                marketCap: baseToken.marketCap,
                chartUrl: `https://coinmarketcap.com/currencies/${baseToken.id}/`,
                swapUrl: `https://binance.com`,
                change: baseToken.priceChange > 0 ? '⬆️' : '⬇️',
                priceChange: baseToken.priceChange,
                priceChangeHour: baseToken.priceChangeHour,
                website: null,
                twitter: null,
                telegram: null,
                volume: baseToken.volume,
                age: '-',
                chainId: baseToken.id,
                fetchAt: false
            };
            sendResponse(tokenData);
            return;
        }

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
                        change: token.priceChange.m5 ? (token.priceChange.m5 > 0 ? '⬆️' : '⬇️') : 0,
                        priceChange: token.priceChange,
                        priceChangeHour: 0,
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

setTimeout(updateBaseTokenInfos, 3000);
setInterval(updateBaseTokenInfos, 1000*60*5);

/*
setInterval(() => {
    Object.keys(tokenCache).forEach(address => {
        fetchTokenData(address, () => {});
    });
}, 60000);
/**
 */
