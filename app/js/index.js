import Web3 from "web3";
import starArtifact from "../../build/contracts/StarContract.json";
// import fleek from '@fleekhq/fleek-storage-js';


// Create a Javascript class to keep track of all the things
// we can do with our contract.
// Credit: https://github.com/truffle-box/webpack-box/blob/master/app/src/index.js
const App = {
    web3: null,
    account: null,
    starContract: null,

    start: async function () {
        // Connect to Web3 instance.
        const { web3 } = this;

        try {
            // Get contract instance.
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = starArtifact.networks[networkId];
            this.starContract = new web3.eth.Contract(
                starArtifact.abi,
                deployedNetwork.address,
            );

            // Get accounts and refresh the balance.
            const accounts = await web3.eth.getAccounts();
            this.account = accounts[0];
            this.refreshBalance();
        } catch (error) {
            console.error("Could not connect to contract or chain: ", error);
        }
    },

    refreshBalance: async function () {
        // Fetch the balanceOf method from our contract.
        const { balanceOf } = this.starContract.methods;

        // Fetch star amount by calling balanceOf in our contract.
        const balance = await balanceOf(this.account).call();

        // Update the page using jQuery.
        $('#balance').html(balance);
        $('#total-stars').show();
        $('my-account').html(this.account);
    },

    storeMetadata: async function (name, to, message) {
        // Build the metadata.
        var metadata = {
            "name": "stars.eth",
            "description": `Star from ${name}`,
            "to": to,
            "message": message,
            "image": "https://ipfs.io/ipfs/QmRGhvqTPvx8kgMSLFdPaCysKvhtP5GV5MsKDmTx3v2QxT",
            "timestamp": new Date().toISOString()
        };

        // Configure the uploader.
        const uploadMetadata = {
            apiKey: 'KlBFeA+IOCSibbOtRjqN9Q==',
            apiSecret: 'k3X0fEIDpMiOw6y2x6OayqJXOvxnr4eT29Gwfb6IG0M=',
            key: `metadata/${metadata.timestamp}.json`,
            data: JSON.stringify(metadata),
        };

        // Tell the user we're sending the star.
        this.setStatus("Sending star... please wait!");

        // Add the metadata to IPFS first, because our contract requires a
        // valid URL for the metadata address.
        const result = await fleek.upload(uploadMetadata);

        // Once the file is added, then we can send a star!
        this.awardItem(to, result.publicUrl);
    },

    awardItem: async function (to, metadataURL) {
        // Fetch the awardItem method from our contract.
        const { awardItem } = this.starContract.methods;

        // Award the star.
        await awardItem(to, metadataURL).send({ from: this.account });

        // Set the status and show the metadata link on IPFS.
        this.setStatus(`Star sent! View the metadata <a href="${metadataURL}" target="_blank">here</a>.`);

        // Finally, refresh the balance (in the case where we send a star to ourselves!)
        this.refreshBalance();
    },

    setStatus: function (message) {
        $('#status').html(message);
    }
};

window.App = App;

// When all the HTML is loaded, run the code in the callback below.
$(document).ready(function () {
    // Detect Web3 provider.
    if (window.ethereum) {
        // use MetaMask's provider
        App.web3 = new Web3(window.ethereum);
        window.ethereum.enable(); // get permission to access accounts
    } else {
        console.warn("No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",);
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        App.web3 = new Web3(
            new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
        );
    }
    // Initialize Web3 connection.
    window.App.start();

    // Capture the form submission event when it occurs.
    $("#star-form").submit(function (e) {
        // Run the code below instead of performing the default form submission action.
        e.preventDefault();

        // Capture form data and create metadata from the submission.
        const name = $("#from").val();
        const to = $("#to").val();
        const message = $("#message").val();

        window.App.storeMetadata(name, to, message);
    });
});


// $(document).ready(function() {
//     StarContract.detectNetwork();

//     $("#star-form").submit(function(e) {
//         e.preventDefault();

//         StarContract.deployed().then(function(instance) {
//             var metadata = {
//                 "name": sender,
//                 "from": $("#sender").val(),
//                 "to": $("#recipient").val(),
//                 "description": $("#message").val(),
//                 "image": "https://ipfs.ip/ipfs/Qmbi6GYikeZYxdNWsLsZY75xgB9Uuy55zZdMT2hedCxGSr"
//             }

//             StarContract.awardItem(recipient, "URL_TO_IPFS_METADATA_JSON");
//         })
//     })
// });