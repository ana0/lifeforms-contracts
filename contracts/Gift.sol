pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";

contract Gift is ERC721Full, Ownable {
    using SafeMath for uint256;

    struct Metadata {
        uint256 created;
        uint256 lastGiven;
        bytes32 name;
    }
    
    uint256 period = 604800;
    mapping (uint256 => Metadata) giftMetadata;

    /**
     * @dev Returns metadata of the given token
     * @param tokenId uint256 ID of the desired metadata
     * @return uint256 created timestamp of when the token was created
     * @return uint256 lastGiven timestamp of when the token was last given
     * @return bytes32 name the name of the token given by its creator
     */
    function getGiftMetadata(uint256 tokenId) public view returns (uint256, uint256, bytes32) {
        return (giftMetadata[tokenId].created, giftMetadata[tokenId].lastGiven, giftMetadata[tokenId].name);
    }

    /**
     * @dev Returns whether the specified token has expired, overrides OpenZeppelin _exists
     * @param tokenId uint256 ID of the token to query the existence of
     * @return bool whether the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return (block.timestamp.sub(giftMetadata[tokenId].lastGiven)) < period;
    }

    /**
     * @dev Mints a new token to msg.sender
     * @param tokenId uint256 ID of the token to be minted
     * @return bool whether the minting was successful
     */
    function mint(uint256 tokenId, bytes32 _name) public returns (bool) {
        _mint(msg.sender, tokenId);
        giftMetadata[tokenId] = Metadata(block.timestamp, block.timestamp, _name);
        return true;
    }
}