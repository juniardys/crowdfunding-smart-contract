// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CrowdFunding is Ownable, ReentrancyGuard {
    enum CampaignStatus {
        Active,
        Finished,
        Canceled
    }

    struct Campaign {
        address fundraiser;
        string title;
        string description;
        string image;
        uint256 targetAmount;
        uint256 totalFunded;
        uint256 totalWithdrawn;
        CampaignStatus status;
        mapping(address => uint256) contributions;
        address[] contributors;
    }

    struct CampaignDetails {
        address fundraiser;
        string title;
        string description;
        string image;
        uint256 targetAmount;
        uint256 totalFunded;
        uint256 totalWithdrawn;
        CampaignStatus status;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed fundraiser,
        string title,
        uint256 targetAmount
    );
    event Funded(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );
    event Withdrawn(uint256 indexed campaignId, uint256 amount);
    event CampaignCanceled(uint256 indexed campaignId);
    event Refunded(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    modifier onlyFundraiser(uint256 _campaignId) {
        require(
            campaigns[_campaignId].fundraiser == msg.sender,
            "Only the fundraiser can perform this action"
        );
        _;
    }

    modifier isActive(uint256 _campaignId) {
        require(
            campaigns[_campaignId].status == CampaignStatus.Active,
            "Campaign is not active"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _image,
        uint256 _targetAmount
    ) external returns (uint256) {
        require(_targetAmount > 0, "Target amount must be greater than zero");

        campaignCount++;
        Campaign storage newCampaign = campaigns[campaignCount];
        newCampaign.fundraiser = msg.sender;
        newCampaign.title = _title;
        newCampaign.description = _description;
        newCampaign.image = _image;
        newCampaign.targetAmount = _targetAmount;
        newCampaign.status = CampaignStatus.Active;

        emit CampaignCreated(campaignCount, msg.sender, _title, _targetAmount);

        return campaignCount;
    }

    function fundCampaign(
        uint256 _campaignId
    ) external payable isActive(_campaignId) nonReentrant {
        require(msg.value > 0, "Contribution must be greater than zero");

        Campaign storage campaign = campaigns[_campaignId];
        if (campaign.contributions[msg.sender] == 0) {
            campaign.contributors.push(msg.sender);
        }
        campaign.totalFunded += msg.value;
        campaign.contributions[msg.sender] += msg.value;

        emit Funded(_campaignId, msg.sender, msg.value);

        // Check if target is reached
        if (campaign.totalFunded >= campaign.targetAmount) {
            campaign.status = CampaignStatus.Finished;
        }
    }

    function withdrawFunds(
        uint256 _campaignId,
        uint256 _amount
    ) external onlyFundraiser(_campaignId) nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(
            campaign.status == CampaignStatus.Active ||
                campaign.status == CampaignStatus.Finished,
            "Campaign is not in a valid state for withdrawal"
        );
        require(
            _amount > 0 &&
                _amount <= address(this).balance &&
                _amount <= (campaign.totalFunded - campaign.totalWithdrawn),
            "Invalid amount"
        );

        campaign.totalWithdrawn += _amount;
        payable(campaign.fundraiser).transfer(_amount);

        emit Withdrawn(_campaignId, _amount);
    }

    function cancelCampaign(
        uint256 _campaignId
    ) external onlyFundraiser(_campaignId) isActive(_campaignId) nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        campaign.status = CampaignStatus.Canceled;

        // Refund all contributors
        for (uint256 i = 0; i < campaign.contributors.length; i++) {
            address contributor = campaign.contributors[i];
            uint256 contribution = campaign.contributions[contributor];
            if (contribution > 0) {
                campaign.contributions[contributor] = 0;
                payable(contributor).transfer(contribution);
                emit Refunded(_campaignId, contributor, contribution);
            }
        }

        emit CampaignCanceled(_campaignId);
    }

    function getCampaignDetails(
        uint256 _campaignId
    ) external view returns (CampaignDetails memory) {
        Campaign storage campaign = campaigns[_campaignId];
        return
            CampaignDetails(
                campaign.fundraiser,
                campaign.title,
                campaign.description,
                campaign.image,
                campaign.targetAmount,
                campaign.totalFunded,
                campaign.totalWithdrawn,
                campaign.status
            );
    }
}
