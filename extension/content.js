let configRegexes = [
    /(?:CA[^a-zA-Z0-9]*)([1-9A-HJ-NP-Za-km-z]{32,44})\b(?!\w)/g,
    /([1-9A-HJ-NP-Za-km-z]{32,44}pump)/g,
    /\$(\w{2,10})/g
];


let icon = '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';
let tableBG = 'border-radius: 20px; background: linear-gradient(135deg, #0a0a0a, #101820, #1a2b38); box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.8);';

function detectSolanaContracts() {
    const tweetElements = document.querySelectorAll("article div[lang]");
    tweetElements.forEach(tweet => {
        try {
            let found = false;
            configRegexes.forEach(regex => {
                if (found) {
                    return;
                }
                let match;
                while ((match = regex.exec(tweet.innerText)) !== null) {
                    const address = match[1];
                    injectTokenInfo(tweet, address);
                    found = true;
                    break;
                }
            });
        } catch(error) {
        }
    });
}

function injectTokenInfo(tweetElement, address) {
    if (!tweetElement || tweetElement.querySelector(`[data-contract='${address}']`)) return;

    try {
        const infoContainer = document.createElement("table");
        infoContainer.setAttribute("data-contract", address);
        infoContainer.setAttribute("style", tableBG);
        infoContainer.innerText = "Fetching token info...";
        infoContainer.style.fontSize = "14px";
        infoContainer.style.color = "#fff";
        //infoContainer.style.textTransform = "uppercase";
        infoContainer.style.backgroundColor = "#000";
        infoContainer.style.border = "2px solid white";
        infoContainer.style.padding = "10px";
        infoContainer.style.zIndex = "1000";
        infoContainer.style.borderSpacing="0";
        infoContainer.style.minWidth = "440px";
        infoContainer.style.textAlign = "left";

        tweetElement.prepend(infoContainer);
        fetchTokenInfo(address, infoContainer);
    } catch (error) {
        console.error("Failed to inject token info: " + error.message);
    }
}

function fetchTokenInfo(address, element) {
    chrome.runtime.sendMessage({ action: "fetchTokenData", address }, response => {
        try {
            if (!response || response.error) {
                element.innerText = response ? response.error : "Error fetching data.";
            } else {

                let socials = '';
                if (response.twitter !== "") {
                    socials +=  '<a style="color:rgb(29, 155, 240)" href="' + response.twitter + '" target="_blank">X</a>&nbsp;';
                }
                if (response.telegram !== "") {
                    socials +=  '<a style="color:rgb(29, 155, 240)" href="' + response.telegram + '" target="_blank">Telegram</a>&nbsp;';
                }
                if (response.website  !== "") {
                    socials +=  '<a style="color:rgb(29, 155, 240)" href="' + response.website + '" target="_blank">Website</a>&nbsp;';
                }

                if (socials === "") {
                    socials = "none";
                }

                element.innerHTML = `
                <thead>
                    <tr><th colspan="2" style="text-align:left"><span style="color: #00FFA3;">S</span><span style="color: #03E1FF;">O</span><span style="color: #DC1FFF;">L</span><span style="color: #00FFA3;">A</span><span style="color: #03E1FF;">N</span><span style="color: #DC1FFF;">A</span> TOKEN INFO</th></tr>
                    <tr><th colspan="2">Token: ${address}</th></tr>
                </thead>
                <tbody style="background:url('data:image/png;base64,${icon}') no-repeat 330px 10px;background-size: 48px">
                    <tr><th>Symbol</th><td>$${response.symbol}</td></tr>
                    <tr><th>MCAP</th><td>${response.marketCap}</td></tr>
                    <tr><th>Price</th><td>${response.price} (m5: ${response.change} ${response.priceChange.m5}%)</td></tr>
                    <tr><th>Age</th><td>${response.age}</td></tr>
                    <tr><th>Vol</th><td>m5: ${response.volume.m5}, h1: ${response.volume.h1}</td></tr>
                    <tr><th>Dex/Buy</th><td><a style="color:rgb(29, 155, 240)" href="${response.chartUrl}" target="_blank">[Chart]</a>&nbsp;<a style="color:rgb(29, 155, 240)" href="${response.swapUrl}" target="_blank">[Buy]</td></tr>
                    <tr><th>Socials</th><td>${socials}</td></tr>
                    <td><th colspan="2"><a href="#"></a></th></td>
                </tbody>
            `;
            }
        } catch (error) {
            element.innerText = error.message;
        }
    });
}

setInterval(detectSolanaContracts, 3000);