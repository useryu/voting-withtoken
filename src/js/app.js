window.Voting = {};


let candidates = {}

let tokenPrice = null;

window.voteForCandidate = function () {
	let candidateName = $("#candidate").val();
	let voteTokens = $("#vote-tokens").val();
	$("#msg").html("Vote has been submitted. The vote count will increment as soon as the vote is recorded on the blockchain. Please wait.")
	$("#candidate").val("");
	$("#vote-tokens").val("");


	Voting.deployed().then(function (contractInstance) {
		contractInstance.voteForCandidate(candidateName, voteTokens, { gas: 140000, from: web3.eth.accounts[0] }).then(function () {
			let div_id = candidates[candidateName];
			return contractInstance.totalVotesFor.call(candidateName).then(function (v) {
				$("#" + div_id).html(v.toString());
				$("#msg").html("");
			});
		});
	});
}


window.buyTokens = function () {
	let tokensToBuy = $("#buy").val();
	let price = tokensToBuy * tokenPrice;
	$("#buy-msg").html("Purchase order has been submitted. Please wait.");
	Voting.deployed().then(function (contractInstance) {
		contractInstance.buy({ value: web3.toWei(price, 'ether'), from: web3.eth.accounts[0] }).then(function (v) {
			$("#buy-msg").html("");
			populateTokenData();
			web3.eth.getBalance(contractInstance.address, function (error, result) {
				$("#contract-balance").html(web3.fromWei(result.toString()) + " Ether");
			});
		})
	});
}

window.lookupVoterInfo = function () {
	let address = $("#voter-info").val();
	Voting.deployed().then(function (contractInstance) {
		contractInstance.voterDetails.call(address).then(function (v) {
			$("#tokens-bought").html("Total Tokens bought: " + v[0].toString());
			let votesPerCandidate = v[1];
			$("#votes-cast").empty();
			$("#votes-cast").append("Votes cast per candidate: <br>");
			let allCandidates = Object.keys(candidates);
			for (let i = 0; i < allCandidates.length; i++) {
				$("#votes-cast").append(allCandidates[i] + ": " + votesPerCandidate[i] + "<br>");
			}
		});
	});
}

function populateCandidates() {
	Voting.deployed().then(function (contractInstance) {
		contractInstance.allCandidates.call().then(function (candidateArray) {
			for (let i = 0; i < candidateArray.length; i++) {
				/* We store the candidate names as bytes32 on the blockchain. We use the
				* handy toUtf8 method to convert from bytes32 to string
				*/
				candidates[web3.toUtf8(candidateArray[i])] = "candidate-" + i;
			}
			setupCandidateRows();
			populateCandidateVotes();
			populateTokenData();
			bindEvents();
		});
	});
}

function isNumber(obj) {  
	return obj === +obj;
}  

function bindEvents() {
	//$(document).on('click', '#voteBt', App.voteForCandidate);
	$(document).on('click', '.candidateName', function(e){
		var ele = e.target;
		var candidateName = ele.innerText.trim();
		let voteTokens = window.prompt('How many tockens you want to vote for'+candidateName+'.', 1);
    if(isNumber(parseInt(voteTokens))){
			$("#msg").html("Vote has been submitted. The vote count will increment as soon as the vote is recorded on the blockchain. Please wait.")
			$("#candidate").val("");
			$("#vote-tokens").val("");	
		
			Voting.deployed().then(function (contractInstance) {
				contractInstance.voteForCandidate(candidateName, voteTokens, { gas: 140000, from: web3.eth.accounts[0] }).then(function () {
					let div_id = candidates[candidateName];
					return contractInstance.totalVotesFor.call(candidateName).then(function (v) {
						$("#" + div_id).html(v.toString());
						$("#msg").html("");
					});
				});
			});
		}else{
			alert('you should input a number, try again!');
		}
	});
}

function populateCandidateVotes() {
	let candidateNames = Object.keys(candidates);
	for (var i = 0; i < candidateNames.length; i++) {
		let name = candidateNames[i];
		Voting.deployed().then(function (contractInstance) {
			contractInstance.totalVotesFor.call(name).then(function (v) {
				$("#" + candidates[name]).html(v.toString());
			});
		});
	}
}

function setupCandidateRows() {
	Object.keys(candidates).forEach(function (candidate) {
		$("#candidate-rows").append("<tr><td class='candidateName'>" + candidate + "</td><td id='" + candidates[candidate] + "'></td></tr>");
	});
}

function populateTokenData() {
	Voting.deployed().then(function (contractInstance) {
		contractInstance.totalTokens().then(function (v) {
			$("#tokens-total").html(v.toString());
		});
		contractInstance.tokensSold.call().then(function (v) {
			$("#tokens-sold").html(v.toString());
		});
		contractInstance.tokenPrice().then(function (v) {
			tokenPrice = parseFloat(web3.fromWei(v.toString()));
			$("#token-cost").html(tokenPrice + " Ether");
		});
		web3.eth.getBalance(contractInstance.address, function (error, result) {
			$("#contract-balance").html(web3.fromWei(result.toString()) + " Ether");
		});
		if(web3.eth.accounts.length>0){
			web3.eth.getBalance(web3.eth.accounts[0], function (error, result) {
				$("#account-balance").html(web3.fromWei(result.toString()) + " Ether");
			});
		}
		contractInstance.getAvailableTokens().then(function (v) {
			$("#available-tokens").html(v.toString());
		});		
	});
}

$(document).ready(function () {
	if (typeof web3 !== 'undefined' && web3.isConnected()) {
		console.warn("Using web3 detected from external source like Metamask")
		// Use Mist/MetaMask's provider
		window.web3 = new Web3(web3.currentProvider);
		web3.net.getListening(function (error, result){
			console.info(result);
		});
		web3.net.getPeerCount(function(error, result){
			console.info(result);
		});
		console.log("Current default: " + web3.eth.defaultAccount);
		if(web3.eth.accounts.length>0){
			web3.eth.getBalance(web3.eth.accounts[0], function (error, result) {
				var eNu = web3.fromWei(result.toString());
				if(eNu>0){
					$.getJSON('Voting.json', function (voting_artifacts) {
						window.Voting = TruffleContract(voting_artifacts);
						Voting.setProvider(web3.currentProvider);
						populateCandidates();
					});
				}
			});
		}else{
			alert('需要登录metamask');
		}
	} else {
		alert('需要安装metamask或mist');
	}

});