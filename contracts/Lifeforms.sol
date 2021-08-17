// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NativeMetaTransaction.sol";
import "./ContextMixin.sol";

contract Lifeforms is Ownable, ERC721, ContextMixin, NativeMetaTransaction {
    // Mapping from token ID to age
    mapping (uint256 => uint) private tokenBirth;

    // Mapping from token ID to duration of this ownership period
    mapping (uint256 => uint) private tokenOwnerBeginning;

    uint256 public maxDuration;
    uint256 public price;
    string public contractURI;

    constructor(string memory name_, string memory symbol_, uint256 _maxDuration) Ownable() ERC721(name_, symbol_) {
        maxDuration = _maxDuration;
        _initializeEIP712(name_);
    }

    function setPrice(uint256 price_) public onlyOwner {
        price = price_;
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
        if (isDead(tokenId)) {
            _burn(tokenId);
        }
        tokenBirth[tokenId] = block.timestamp;
        tokenOwnerBeginning[tokenId] = block.timestamp;
    }

    function birth(address to, uint256 tokenId) public {
        _birth(tokenId);
        _mint(to, tokenId);
    }

    function safeBirth(address to, uint256 tokenId) public {
        _birth(tokenId);
        _safeMint(to, tokenId);
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