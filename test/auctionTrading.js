const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');
const AuctionTrading = artifacts.require('AuctionTrading');

contract('AuctionTrading', (accounts) => {
  let auctionTrading;
  const auction = {
    name: 'auction1',
    description: 'Selling item1',
    min: 10,
    duration: 86400 + 1
  };
  const [seller, buyer1, buyer2] = [accounts[0], accounts[1], accounts[2]];
  beforeEach(async () => {
    auctionTrading = await AuctionTrading.new();
  });

  it(
    'should NOT create a new auction if duration is not between 1-10 days', 
    async () => {
    await expectRevert(
      auctionTrading.createAuction(
        'auction1',
        'Selling item1',
        10,
        1
      ),
      ' _duration must be in the range of 1 day to 10 days'
    );
    await expectRevert(
      auctionTrading.createAuction(
        'auction1',
        'Selling item1',
        10,
        86400 * 10 + 11
      ),
      ' _duration must be in the range of 1 day to 10 days'
    );
  })

  it('should create an auction', async() => {
    let auctions;
    const now = parseInt((new Date()).getTime() / 1000);
    time.increaseTo(now);
    await auctionTrading.createAuction(
      auction.name,
      auction.description,
      auction.min,
      auction.duration
    );
    auctions = await auctionTrading.getAllAuctions();
    assert(auctions.length === 1);
    assert(auctions[0].name === auction.name);
    assert(auctions[0].description === auction.description);
    assert(parseInt(auctions[0].min) === auction.min);
    assert(parseInt(auctions[0].end) === now + auction.duration);

    auctions = await auctionTrading.getUserAuctions(seller);
    assert(auctions.length === 1);
    assert(auctions[0].name === auction.name);
    assert(auctions[0].description === auction.description);
    assert(parseInt(auctions[0].min) === auction.min);
    assert(parseInt(auctions[0].end) === now + auction.duration);
  });

  it('should NOT create bid if auction does not exist', async () => {
    await expectRevert(
      auctionTrading.createBid(1, {from: buyer1, value: auction.min + 10}),
      'auction doesnt exist'
    );
  });

  it('should NOT create bid if auction has expired', async () => {
    const now = parseInt((new Date()).getTime() / 1000);
    time.increaseTo(now);
    await auctionTrading.createAuction(
      auction.name,
      auction.description,
      auction.min,
      auction.duration
    );
    time.increaseTo(now + auction.duration + 10);
    await expectRevert(
      auctionTrading.createBid(1, {from: buyer1, value: auction.min + 10}),
      'auction has ended'
    );
  });

  it('should NOT create offer if price too low', async () => {
    await auctionTrading.createAuction(
      auction.name,
      auction.description,
      auction.min,
      auction.duration
    );
    await expectRevert(
      auctionTrading.createBid(1, {from: buyer1, value: auction.min - 1}),
      ' Bid must be bigger than min Bid And bigger than best Bid'
    );
    await auctionTrading.createBid(1, {from: buyer1, value: auction.min + 1}),
    await expectRevert(
      auctionTrading.createBid(1, {from: buyer2, value: auction.min}),
      ' Bid must be bigger than min Bid And bigger than best Bid'
    );
  });

  it('should create bid', async () => {
    await auctionTrading.createAuction(
      auction.name,
      auction.description,
      auction.min,
      auction.duration
    );
    await auctionTrading.createBid(1, {from: buyer1, value: auction.min});
    const userBids = await auctionTrading.getUserBids(buyer1);
    assert(userBids.length === 1);
    assert(parseInt(userBids[0].id) === 1);
    assert(parseInt(userBids[0].auctionId) === 1);
    assert(userBids[0].buyer === buyer1);
    assert(parseInt(userBids[0].price) === auction.min);
  });

  it('should NOT trade if auction does not exist', async () => {
    await expectRevert(
      auctionTrading.tradeAuction(1),
      'auction doesnt exist'
    );
  });

  it('should NOT trade if auction is active', async () => {
     await auctionTrading.createAuction(
      auction.name,
      auction.description,
      auction.min,
      auction.duration
    );
    await auctionTrading.createBid(1, {from: buyer1, value: auction.min});
    await expectRevert(
          auctionTrading.tradeAuction(1),
          'auction is active'
        );
  });


/*  //to be used different test file//
  it('should trade', async () => {
    const bestPrice = web3.utils.toBN(auction.min + 10);
    const now = parseInt((new Date()).getTime() / 1000);
    time.increaseTo(now);
     await auctionTrading.createAuction(
      auction.name,
      auction.description,
      auction.min,
      auction.duration
    );
    await auctionTrading.createBid(1, {from: buyer1, value: auction.min});
    await auctionTrading.createBid(1, {from: buyer2, value: bestPrice});
    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(seller));
  //ignore gas price calculation (send from another account)
    time.increaseTo(now + auction.duration + 100); 
    await auctionTrading.tradeAuction(1, {from: accounts[9]});
    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(seller));
    assert(balanceAfter.sub(balanceBefore).eq(bestPrice));
  }); */
});
