let configRegexes = [
    /(?:CA[^a-zA-Z0-9]*)([1-9A-HJ-NP-Za-km-z]{32,44})\b(?!\w)/g,
    /([1-9A-HJ-NP-Za-km-z]{32,44}pump)/g
    /*,
    /\$(\w{2,10})/g
    */
];


let icon = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAA7EAAAOxAGVKw4bAAADBElEQVQ4yz2RzWucZRTFf8/HOx+dTCbJpJNJmpLYlBQ00FJroghqBSsiIojgugv/ABHcuFD/BUEoIoig4krwA2yVirXRWI2ItImxTSJpE8M0TdIk7UzmfZ/7XBcJrg4cOOfce475+soFdUlCLnG4xGKdxVowzoKzqDGIKlENWVSCKCEqEpRMDT4qOEBRVBVUUSyqYADFgLVo3CcAdB9ixBL3RBiDc+b/K5y3WGMxxmCNwViLZJF/FzbIUiFGiKL4PTODcYbJSzeYrMPCaJHXtqocH+whpJHLPy5xcX2IxtWb+LOeN+5YitUOiIpFQTQys3aXT978jD8fciz3FXhbtlha2eHTd7/l48ld1uxhRg5UefCjOQpdRVQiMUasAjvNNtdurSOVBPfBNdJVS6dWef3n21xcLaG1I7xabRC2yjz7ygl2cg6RiATBRwHJlLLAwadPsPnhFNvFPjrHTmK7+lkc7uWsb7Ew0+Tl51MOHa2zvd0kjYpG8CqRnHcMVToYfekp3GPjvPfWOR59Z4xavcym9dz6oUV/aYEzz71AVynh/Ozfey+IYGPcm9GJ5ehAH7Pzazz85ClcDLRagT+m77MxX6S53sn03Abz67tYUVQiEhQvQTDOcyDv+OKby9yevU7lxXFWTJEbf91nawlOuhx2aYzvPv+dodN1hiqOGCIqESshEoOSOMfNX+awp0c4P9DBb802G0vX6f5nip5YZDB2M/zVONWdXSSAiBKyiE2D0mxlzMw2uPrlFD+dqnEnZ2i3NhhZnKG1eIG0Mc3AZoHH7x2hfSVDQkSyiISID5nQSoXGyjaF7hL3zl2iNDHGM6s75I4Pk88l/Pr9+xw71EuPrxOOpWRpIEsDISg+TYV0N1AoeEbPPEFeI48UuyhN9LO8fJcsWHLlEo0H5qhOpJSLFdppIAv7JWZZxFhDrV6ht1amq1qiUsmjqhzsK4PzDI7UODzUjUsM7d1AGhQRJZOIb4vinKXcmcfnHD5xZKIo4PIJtboHa4gozZYQguylR8iC8h+c9pPmb9wHtQAAAABJRU5ErkJggg==';
let tableBG = 'border-radius: 15px; background: linear-gradient(135deg, #0a0a0a, #101820, #1a2b38); box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.8); color: white; font-size: 20px; font-weight: bold; text-transform: uppercase;';

function detectSolanaContracts() {
    const tweetElements = document.querySelectorAll("article div[lang]");
    tweetElements.forEach(tweet => {
        configRegexes.forEach(regex => {
            let match;
            while ((match = regex.exec(tweet.innerText)) !== null) {
                const address = match[1];
                injectTokenInfo(tweet, address);
                break;
            }
        });
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
        infoContainer.style.fontFamily = "Arial, sans-serif";
        infoContainer.style.color = "#fff";
        infoContainer.style.backgroundColor = "#000";
        infoContainer.style.border = "1px solid white";
        infoContainer.style.padding = "4px";
        infoContainer.style.borderRadius = "3px";
        infoContainer.style.marginLeft = "8px";
        infoContainer.style.zIndex = "1000";



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
                    <tr><th colspan="2">${address}</th></tr>
                </thead>
                <tbody>
                    <tr><th>Symbol:</th><td>${response.symbol}</td></tr>
                    <tr><th>MCAP:</th><td>${response.marketCap}</td></tr>
                    <tr><th>Price:</th><td>${response.price} (m5: ${response.change})</td></tr>
                    <tr><th>Age:</th><td>${response.age}</td></tr>
                    <tr><th>Vol:</th><td>m5: ${response.volume.m5}, h1: ${response.volume.h1}</td></tr>
                    <tr><th>Dex/Bux</th><td><a style="color:rgb(29, 155, 240)" href="${response.chartUrl}" target="_blank">[Chart]</a>&nbsp;<a style="color:rgb(29, 155, 240)" href="${response.swapUrl}" target="_blank">[Buy]</td></tr>
                    <tr><th>Socials:</th><td>${socials}</td></tr>
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