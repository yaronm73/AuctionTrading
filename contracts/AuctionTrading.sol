pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

contract AuctionTrading {

    struct Auction {
      uint id;
      address payable seller;
      string name;
      string description;
      uint min;
      uint end;
      uint bestBidId;
      uint [] bidIds;
    }
    
    struct Bid {
        uint id;
        uint auctionId;
        address payable buyer;
        uint price;
    }

    mapping(uint => Auction) private auctions;
    mapping(uint => Bid) private bids;
    mapping(address => uint[]) private userAuctions;
    mapping(address => uint[]) private userBids;
    uint private nextAuctionId = 1; 
    uint private nextBidId = 1; 
    
    function createAuction(
      string calldata _name,
      string calldata _description,
      uint _min,
      uint _duration)
      external {
         require(_min > 0, '_min must be > 0');
         require(_duration > 86400 && _duration < 864000, ' _duration must be in the range of 1 day to 10 days');
         uint[] memory bidIds = new uint[](0);
         auctions[nextAuctionId] = Auction (
             nextAuctionId,
             msg.sender,
             _name,
             _description,
             _min,
             block.timestamp + _duration,
             0,
             bidIds
          );
          userAuctions[msg.sender].push(nextAuctionId);
          nextAuctionId++;
    }
    
    function createBid(uint _auctionId)
        external
        payable
        auctionExists(_auctionId) {
            Auction storage auction = auctions[_auctionId];
            Bid storage bestBid = bids[auction.bestBidId];
            require(block.timestamp < auction.end, 'auction has ended');
            require(msg.value >= auction.min && msg.value > bestBid.price, ' Bid must be bigger than min Bid And bigger than best Bid');
            auction.bestBidId = nextBidId;
            auction.bidIds.push(nextBidId);
            bids[nextBidId] = Bid(nextBidId, _auctionId, msg.sender, msg.value);
            userBids[msg.sender].push(nextBidId);
            nextBidId++;
        }
    function tradeAuction(uint _auctionId)
        external
        auctionExists(_auctionId) {
            Auction storage auction = auctions[_auctionId];
            Bid storage bestBid = bids[auction.bestBidId];
            require(block.timestamp > auction.end, 'auction is active');
            for(uint i; i < auction.bidIds.length; i++) {
                uint bidId = auction.bidIds[i];
                if(bidId != auction.bestBidId) {
                    Bid storage bidReimburse = bids[bidId];
                    bidReimburse.buyer.transfer(bidReimburse.price);
                }
            }
            auction.seller.transfer(bestBid.price);
        
        }    
    
    function getAllAuctions() view external returns(Auction[] memory) {
        Auction[] memory _auctions = new Auction[](nextAuctionId - 1);
        for(uint i = 1; i < nextAuctionId ; i++) {
            _auctions[i-1] = auctions[i];
        }
        return _auctions;
    }
    
    function getUserAuctions(address _user) view external returns(Auction[] memory) {
        uint[] storage userAuctionIds = userAuctions[_user];
        Auction[] memory _auctions = new Auction[](userAuctionIds.length);
        for(uint i = 0; i < userAuctionIds.length; i++) {
            uint auctionId = userAuctionIds[i];
            _auctions[i] = auctions[auctionId];
        }
        return _auctions;
    }
    
    function getUserBids(address _user) view external returns(Bid[] memory) {
        uint[] storage userBidIds = userBids[_user];
        Bid[] memory _bids = new Bid[](userBidIds.length);
        for(uint i = 0; i < userBidIds.length; i++) {
            uint bidId = userBidIds[i];
            _bids[i]  = bids[bidId];
        }
        return _bids;
    }
    
    modifier auctionExists(uint _auctionId) {
        require( 0 < _auctionId &&  _auctionId < nextAuctionId , 'auction doesnt exist');
        _;
    }
}