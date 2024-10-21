// test/CrowdFunding.test.js
import { expect } from "chai";
import { ethers } from "hardhat";
import { CrowdFunding } from "../typechain-types";
import { parseEther } from "ethers";
import { CrowdFundingDataForContract } from "../data/crowdfund-data";

describe("CrowdFunding", function () {
  let crowdFunding: CrowdFunding;
  let owner: any;
  let contributor: any;

  beforeEach(async () => {
    // Get signers
    [owner, contributor] = await ethers.getSigners();

    // Deploy CrowdFunding contract
    const CrowdFundingFactory = await ethers.getContractFactory("CrowdFunding");
    crowdFunding = (await CrowdFundingFactory.connect(
      owner
    ).deploy()) as CrowdFunding;
  });

  it("should create a campaign & get details successfully", async () => {
    // Create campaign
    const crowdFundData = CrowdFundingDataForContract[0];
    await crowdFunding
      .connect(owner)
      .createCampaign(
        crowdFundData.title,
        crowdFundData.description,
        crowdFundData.imageUrl,
        parseEther(crowdFundData.targetAmount.toString())
      );

    const campaignDetails = await crowdFunding.getCampaignDetails(1);
    expect(campaignDetails.title).to.equal(crowdFundData.title);
    expect(campaignDetails.targetAmount).to.equal(
      parseEther(crowdFundData.targetAmount.toString())
    );
    expect(campaignDetails.status).to.equal(0); // Active
  });

  it("should fund the campaign", async () => {
    // Create campaign
    const crowdFundData = CrowdFundingDataForContract[0];
    await crowdFunding
      .connect(owner)
      .createCampaign(
        crowdFundData.title,
        crowdFundData.description,
        crowdFundData.imageUrl,
        parseEther(crowdFundData.targetAmount.toString())
      );

    // Contract balance before fund
    const beforeBalance = await ethers.provider.getBalance(
      crowdFunding.getAddress()
    );

    // Fund campaign
    const fundAmount = parseEther("0.5");
    await crowdFunding
      .connect(contributor)
      .fundCampaign(1, { value: fundAmount });

    // Contract balance after fund
    const afterBalance = await ethers.provider.getBalance(
      crowdFunding.getAddress()
    );
    expect(afterBalance).to.greaterThan(beforeBalance);

    const campaignDetails = await crowdFunding.getCampaignDetails(1);
    expect(campaignDetails.totalFunded).to.equal(fundAmount);
  });

  it("should allow the fundraiser to withdraw funds", async () => {
    // Create campaign
    const crowdFundData = CrowdFundingDataForContract[0];
    await crowdFunding
      .connect(owner)
      .createCampaign(
        crowdFundData.title,
        crowdFundData.description,
        crowdFundData.imageUrl,
        parseEther(crowdFundData.targetAmount.toString())
      );

    // Fund campaign
    const fundAmount = parseEther("0.5");
    await crowdFunding
      .connect(contributor)
      .fundCampaign(1, { value: fundAmount });

    // Get balance before withdraw
    const beforeBalance = await ethers.provider.getBalance(owner.address);

    const withdrawAmount = parseEther("0.5");
    await crowdFunding.connect(owner).withdrawFunds(1, withdrawAmount);

    // Get balance after withdraw
    const afterBalance = await ethers.provider.getBalance(owner.address);

    expect(afterBalance).to.greaterThan(beforeBalance);

    const campaignDetails = await crowdFunding.getCampaignDetails(1);
    expect(campaignDetails.totalWithdrawn).to.equal(withdrawAmount);
  });

  it("should cancel the campaign and refund contributors", async () => {
    // Create campaign
    const crowdFundData = CrowdFundingDataForContract[0];
    await crowdFunding
      .connect(owner)
      .createCampaign(
        crowdFundData.title,
        crowdFundData.description,
        crowdFundData.imageUrl,
        parseEther(crowdFundData.targetAmount.toString())
      );

    // Fund campaign
    const fundAmount = parseEther("0.5");
    await crowdFunding
      .connect(contributor)
      .fundCampaign(1, { value: fundAmount });

    // Get balance before cancel
    const beforeBalance = await ethers.provider.getBalance(contributor.address);

    await crowdFunding.connect(owner).cancelCampaign(1);

    // Get balance after cancel
    const afterBalance = await ethers.provider.getBalance(contributor.address);
    expect(afterBalance).to.greaterThan(beforeBalance);

    const campaignDetails = await crowdFunding.getCampaignDetails(1);
    expect(campaignDetails.status).to.equal(2); // Canceled
  });

  it("should not allow funding a canceled campaign", async () => {
    // Create campaign
    const crowdFundData = CrowdFundingDataForContract[0];
    await crowdFunding
      .connect(owner)
      .createCampaign(
        crowdFundData.title,
        crowdFundData.description,
        crowdFundData.imageUrl,
        parseEther(crowdFundData.targetAmount.toString())
      );

    // Cancel campaign
    await crowdFunding.connect(owner).cancelCampaign(1);

    await expect(
      crowdFunding
        .connect(contributor)
        .fundCampaign(1, { value: parseEther("0.5") })
    ).to.be.revertedWith("Campaign is not active");
  });
});
