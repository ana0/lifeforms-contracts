// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NativeMetaTransaction.sol";
import "./ContextMixin.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/EnumerableMap.sol";

contract Lifeforms is Ownable, ERC721, ContextMixin, NativeMetaTransaction {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToAddressMap;

    // Mapping from token ID to age
    mapping (uint256 => uint) public tokenBirth;

    // Mapping from token ID to duration of this ownership period
    mapping (uint256 => uint) public tokenOwnerBeginning;

    // Mapping from holder address to their (enumerable) set of owned tokens
    mapping (address => EnumerableSet.UintSet) private _holderTokens;

    // Enumerable mapping from token ids to their owners
    EnumerableMap.UintToAddressMap private _tokenOwners;

    uint256 public maxDuration;
    uint256 public price;
    string public contractURI;

    constructor(string memory name_, string memory symbol_, uint256 _maxDuration, uint256 price_) Ownable() ERC721(name_, symbol_) {
        maxDuration = _maxDuration;
        price = price_;
        _initializeEIP712(name_);
    }

    function setPrice(uint256 price_) public onlyOwner {
        price = price_;
    }

    function setDuration(uint256 duration_) public onlyOwner {
        maxDuration = duration_;
    }

    function setBaseURI(string memory baseURI_) public onlyOwner {
        _setBaseURI(baseURI_);
    }

    function setContractURI(string memory contractURI_) public onlyOwner {
        contractURI = contractURI_;
    }

    function withdraw() public onlyOwner {
        bool sent = payable(owner()).send(address(this).balance);
        require(sent, "Failed to send Ether");
    }

    function isDead(uint256 tokenId) public view returns (bool) {
        // lifeform was never born
        if (!_exists(tokenId)) {
            return false;
        }
        // lifeform was not transfered in time, and is dead
        if (block.timestamp - tokenOwnerBeginning[tokenId] > maxDuration) {
            return true;
        }
        // lifeform is alive currently
        return false;
    }

    function isAlive(uint256 tokenId) public view returns (bool) {
        return (_exists(tokenId) && !isDead(tokenId));
    }

    function _birth(uint256 tokenId) internal {
        // if (isDead(tokenId)) {
        //     _burn(tokenId);
        // }
        tokenBirth[tokenId] = block.timestamp;
        tokenOwnerBeginning[tokenId] = block.timestamp;
    }

    function birth(address to, uint256 tokenId) public payable {
        require(msg.value >= price, "Insufficient funds");
        _birth(tokenId);
        _mint(to, tokenId);
    }

    function safeBirth(address to, uint256 tokenId) public {
        _birth(tokenId);
        _safeMint(to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        if (from != to) {
            tokenOwnerBeginning[tokenId] = block.timestamp;
        }
        if (!isDead(tokenId)) {
            super.transferFrom(from, to, tokenId);
        }
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        if (from != to) {
            tokenOwnerBeginning[tokenId] = block.timestamp;
        }
        if (!isDead(tokenId)) {
            super.safeTransferFrom(from, to, tokenId);
        }
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual override {
        if (from != to) {
            tokenOwnerBeginning[tokenId] = block.timestamp;
        }
        if (!isDead(tokenId)) {
            super.safeTransferFrom(from, to, tokenId, _data);
        }
    }

    function balanceOf(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "ERC721: balance query for the zero address");
        uint count = 0;
        for (uint i = 0; i <= _holderTokens[owner].length(); i++) {
            if (isAlive(uint256(_holderTokens[owner]._inner._values[i]))) {
                count += 1;
            }
        }
        return count;
    }

    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        if (isAlive(tokenId)) {
            super.ownerOf(tokenId);
        } else {
            return address(0);
        }
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (isAlive(tokenId)) {
            super.tokenURI(tokenId);
        } else {
            return "";
        }
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual override returns (uint256) {
        if (isAlive(_holderTokens[owner].at(index))) {
            super.tokenOfOwnerByIndex(owner, index);
        } else {
            return 0;
        }
    }

    function tokenByIndex(uint256 index) public view virtual override returns (uint256) {
        (uint256 tokenId, ) = _tokenOwners.at(index);
        if (isAlive(tokenId)) {
            return tokenId;
        } else {
            return 0;
        }
    }

    /**
     * This is used instead of msg.sender as transactions won't be sent by the original token owner, but by OpenSea.
     */
    function _msgSender()
        internal
        override
        view
        returns (address payable sender)
    {
        return ContextMixin.msgSender();
    }

    /**
    * As another option for supporting trading without requiring meta transactions, override isApprovedForAll to whitelist OpenSea proxy accounts on Matic
    */
    function isApprovedForAll(
        address _owner,
        address _operator
    ) public override view returns (bool isOperator) {
        if (_operator == address(0x58807baD0B376efc12F5AD86aAc70E78ed67deaE)) {
            return true;
        }
        
        return ERC721.isApprovedForAll(_owner, _operator);
    }
}