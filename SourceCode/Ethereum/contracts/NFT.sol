// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./Permissions.sol";

contract NFT is ERC721URIStorage, ERC721Enumerable, Permissions {
    uint256 public tokenCount;

    constructor() ERC721("Patent NFT", "PNFT") {
        _patentFees = 0.0046 ether;
        _transferCommissionPercentage = 5;
    }

    struct TokenInfo {
        uint256 tokenId;
        address initialTokenOwner;
        address currentTokenOwner;
        string tokenURI;
    }
    uint256 public _patentFees;
    uint256 public _transferCommissionPercentage = 5;
    mapping(uint256 => TokenInfo) public _tokenList;
    mapping(address => uint256[]) public _ownedTokens;
    mapping(address => uint256) public _ownedTokensCount;
    mapping(uint256 => address) public _initialTokenOwnerOf;
    mapping(uint256 => address) public _currentTokenOwnerOf;
    mapping(uint256 => string) public _tokenURIOf;
    mapping(uint256 => bool) public _feePaymentStatus;
    mapping(uint256 => address) public _tokenBuyer;
    mapping(uint256 => uint256) public _tokenPrice;
    mapping(uint256 => uint256) public _transferCount;

    event MintEvent(TokenInfo);
    event TransferEvent(
        uint256 tokenId,
        address from,
        address to,
        uint256 price,
        uint256 commission
    );
    event PatentPaymentEvent(uint256 tokenId, uint256 amount, address user);
    event TransactionLog(
        uint256 tokenId,
        uint256 amount,
        address from,
        address to,
        string transactionType,
        uint256 timestamp
    );

    function mint(
        uint256 _tokenId,
        string memory _tokenURI,
        address _owner
    ) external onlyAuthority {
        require(
            _feePaymentStatus[_tokenId] = true,
            "Fees has not been paid for this patent."
        );
        tokenCount++;
        _safeMint(_owner, _tokenId);
        _setTokenURI(_tokenId, _tokenURI);
        _tokenList[_tokenId] = TokenInfo(_tokenId, _owner, _owner, _tokenURI);
        _ownedTokensCount[_owner]++;
        _ownedTokens[_owner].push(_tokenId);
        _initialTokenOwnerOf[_tokenId] = _owner;
        _currentTokenOwnerOf[_tokenId] = _owner;
        _tokenURIOf[_tokenId] = _tokenURI;
        emit MintEvent(_tokenList[_tokenId]);
        emit TransactionLog(
            _tokenId,
            0,
            address(0),
            _owner,
            "NFT Created",
            block.timestamp
        );
    }

    function listTokens() external view returns (TokenInfo[] memory) {
        TokenInfo[] memory allTokens = new TokenInfo[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            allTokens[i] = _tokenList[i + 1];
        }
        return allTokens;
    }

    function listTokensOf(address _address)
        external
        view
        returns (TokenInfo[] memory)
    {
        uint256 ownedTokensCount = _ownedTokensCount[_address];
        uint256[] memory ownedTokens = _ownedTokens[_address];
        TokenInfo[] memory ownTokens = new TokenInfo[](ownedTokensCount);
        for (uint256 i = 0; i < ownedTokensCount; i++) {
            ownTokens[i] = _tokenList[ownedTokens[i]];
        }
        return ownTokens;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function burn(uint256 _tokenId) external onlyAuthority {
        _tokenList[_tokenId].currentTokenOwner = address(0);
        _burn(_tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function setTransferCommission(uint256 value) external onlyAuthority {
        _transferCommissionPercentage = value;
    }

    function setPatentFees(uint256 _amount) external onlyAuthority {
        _patentFees = _amount;
    }

    function payPatentFees(uint256 _tokenId) external payable {
        require(
            _feePaymentStatus[_tokenId] == false,
            "Fees for this patent has already been paid"
        );
        require(_patentFees == msg.value, "Amount not equal to patent fees");
        _feePaymentStatus[_tokenId] = true;
        authority.transfer(msg.value);
        emit PatentPaymentEvent(_tokenId, _patentFees, msg.sender);
        emit TransactionLog(
            _tokenId,
            msg.value,
            msg.sender,
            authority,
            "Patent Fees Paid",
            block.timestamp
        );
    }

    //Should be called by the token owner
    function giveApprovalToContract(uint256 _tokenId) public {
        approve(address(this), _tokenId);
    }

    function setTokenBuyer(
        uint256 _tokenId,
        address _buyer,
        uint256 _price
    ) external onlyAuthority {
        _tokenBuyer[_tokenId] = _buyer;
        _tokenPrice[_tokenId] = _price;
    }

    //Should be called(by buyer) after getting approval from token owner
    function buyNft(uint256 _tokenId) external payable {
        require(
            msg.sender == _tokenBuyer[_tokenId],
            "Transfer not authoried by Authority."
        );
        require(
            msg.value == _tokenPrice[_tokenId],
            "Token price not equal to set price."
        );
        address _tokenOwner = _tokenList[_tokenId].currentTokenOwner;
        require(msg.sender != _tokenOwner, "You already own this token.");
        uint256 _totalPrice = msg.value;
        address payable seller = payable(_tokenOwner);
        uint256 _commission = (_totalPrice * _transferCommissionPercentage) /
            100;
        uint256 _remainingAmount = _totalPrice - _commission;
        address _buyer = msg.sender;
        authority.transfer(_commission); //commission
        seller.transfer(_remainingAmount);
        this.safeTransferFrom(_tokenOwner, _buyer, _tokenId);
        _transferCount[_tokenId]++;
        _tokenList[_tokenId].currentTokenOwner = _buyer;
        _currentTokenOwnerOf[_tokenId] = _buyer;
        _tokenBuyer[_tokenId] = address(0);
        _tokenPrice[_tokenId] = 0;
        emit TransferEvent(
            _tokenId,
            _tokenOwner,
            _buyer,
            _totalPrice,
            _commission
        );
        emit TransactionLog(
            _tokenId,
            msg.value,
            _tokenOwner,
            _buyer,
            "Patent Transferred",
            block.timestamp
        );
    }

    function clearContractBalance() external onlyAuthority {
        authority.transfer(address(this).balance);
    }
}