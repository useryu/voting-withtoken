pragma solidity ^0.4.18; 

   // ERC Token Standard #20 Interface
  // https://github.com/ethereum/EIPs/issues/20
contract ERC20Interface {
    // 获取总的支持量
    function totalSupply() public view returns (uint256 totalSupply);

    // 获取其他地址的余额
    function balanceOf(address _owner) public view returns (uint256 balance);

    // 向其他地址发送token
    function transfer(address _to, uint256 _value) public returns (bool success);

    // 从一个地址想另一个地址发送余额
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success);

    //允许_spender从你的账户转出_value的余额，调用多次会覆盖可用量。某些DEX功能需要此功能
    function approve(address _spender, uint256 _value) public returns (bool success);

    // 返回_spender仍然允许从_owner退出的余额数量
    function allowance(address _owner, address _spender) public view returns (uint256 remaining);

    // token转移完成后出发
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    // approve(address _spender, uint256 _value)调用后触发
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}

contract Voting {

    struct voter {
        address voterAddress;//投票人账户地址
        uint tokensBought;//投票人持有的股票通证总量
        uint[] tokensUsedPerCandidate;//为每个候选人消耗的股票通证数量
    }

    mapping (address => voter) public voterInfo;

    mapping (bytes32 => uint) public votesReceived;

    bytes32[] public candidateList;

    uint public totalTokens; 
    uint public balanceTokens;
    uint public tokenPrice;

    constructor(uint tokens, uint pricePerToken, bytes32[] candidateNames) public {
        candidateList = candidateNames;
        totalTokens = tokens;
        balanceTokens = tokens;
        tokenPrice = pricePerToken;
    }

    //使用msg.value来读取用户的支付金额，这要求方法必须具有payable声明
    function buy() payable public returns (uint) {
        uint tokensToBuy = msg.value / tokenPrice;
        require(tokensToBuy <= balanceTokens);
        voterInfo[msg.sender].voterAddress = msg.sender;
        voterInfo[msg.sender].tokensBought += tokensToBuy;
        balanceTokens -= tokensToBuy;
        return tokensToBuy;
    }

    function totalVotesFor(bytes32 candidate) view public returns (uint) {
        return votesReceived[candidate];
    }

    function voteForCandidate(bytes32 candidate, uint votesInTokens) public {
        uint index = indexOfCandidate(candidate);
        require(index != uint(-1));

        if (voterInfo[msg.sender].tokensUsedPerCandidate.length == 0) {
            for (uint i = 0; i < candidateList.length; i++) {
                voterInfo[msg.sender].tokensUsedPerCandidate.push(0);//该投票人为每个候选人投入的通证数量初始化为0
            }
        }

        uint availableTokens = voterInfo[msg.sender].tokensBought - totalTokensUsed(voterInfo[msg.sender].tokensUsedPerCandidate);
        require (availableTokens >= votesInTokens);

        votesReceived[candidate] += votesInTokens;
        voterInfo[msg.sender].tokensUsedPerCandidate[index] += votesInTokens;
    }

    function getAvailableTokens() view public returns (uint) {
        return voterInfo[msg.sender].tokensBought - totalTokensUsed(voterInfo[msg.sender].tokensUsedPerCandidate);
    }

    function totalTokensUsed(uint[] _tokensUsedPerCandidate) private pure returns (uint) {
        uint totalUsedTokens = 0;
        for(uint i = 0; i < _tokensUsedPerCandidate.length; i++) {
            totalUsedTokens += _tokensUsedPerCandidate[i];
        }
        return totalUsedTokens;
    }

    function indexOfCandidate(bytes32 candidate) view public returns (uint) {
        for(uint i = 0; i < candidateList.length; i++) {
            if (candidateList[i] == candidate) {
                return i;
            }
        }
        return uint(-1);
    }

    function tokensSold() view public returns (uint) {
        return totalTokens - balanceTokens;
    }

    function voterDetails(address user) view public returns (uint, uint[]) {
        return (voterInfo[user].tokensBought, voterInfo[user].tokensUsedPerCandidate);
    }

    //最后的金额应该只能转到指定白名单
    function transferTo(address account) public {
        account.transfer(this.balance);
    }

    function allCandidates() view public returns (bytes32[]) {
        return candidateList;
    }
}
