// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title GalamseyReporter
 * @notice Smart contract for recording environmental reports on Scroll Sepolia
 * @dev Records report hashes and tracks rewards per wallet address
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Deploy this contract on Scroll Sepolia testnet
 * 2. Set the contract address in SCROLL_CONTRACT_ADDRESS secret
 * 3. The contract owner can adjust reward amounts if needed
 * 
 * Network: Scroll Sepolia Testnet
 * Chain ID: 534351
 * RPC: https://sepolia-rpc.scroll.io
 * Explorer: https://sepolia.scrollscan.com
 */
contract GalamseyReporter {
    // Events
    event ReportSubmitted(
        address indexed reporter,
        bytes32 indexed reportHash,
        uint256 timestamp,
        uint256 rewardEarned
    );
    
    event RewardsClaimed(
        address indexed user,
        uint256 amount
    );

    // State variables
    address public owner;
    uint256 public rewardPerReport = 10 * 10**18; // 10 tokens per report (18 decimals)
    uint256 public totalReportsSubmitted;
    
    // Mappings
    mapping(bytes32 => bool) public reportExists;
    mapping(bytes32 => address) public reportSubmitter;
    mapping(bytes32 => uint256) public reportTimestamp;
    mapping(address => uint256) public rewardsEarned;
    mapping(address => uint256) public reportCount;
    mapping(address => bytes32[]) public userReports;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Submit a new environmental report hash
     * @param reportHash The keccak256 hash of the report data
     * @return success Whether the submission was successful
     */
    function submitReport(bytes32 reportHash) external returns (bool success) {
        require(reportHash != bytes32(0), "Invalid report hash");
        require(!reportExists[reportHash], "Report already submitted");

        // Record the report
        reportExists[reportHash] = true;
        reportSubmitter[reportHash] = msg.sender;
        reportTimestamp[reportHash] = block.timestamp;
        
        // Credit rewards to the submitter
        rewardsEarned[msg.sender] += rewardPerReport;
        reportCount[msg.sender] += 1;
        userReports[msg.sender].push(reportHash);
        
        totalReportsSubmitted += 1;

        emit ReportSubmitted(
            msg.sender,
            reportHash,
            block.timestamp,
            rewardPerReport
        );

        return true;
    }

    /**
     * @notice Get total rewards earned by an address
     * @param user The wallet address to check
     * @return The total rewards earned (in wei)
     */
    function getRewards(address user) external view returns (uint256) {
        return rewardsEarned[user];
    }

    /**
     * @notice Get the number of reports submitted by an address
     * @param user The wallet address to check
     * @return The number of reports submitted
     */
    function getReportCount(address user) external view returns (uint256) {
        return reportCount[user];
    }

    /**
     * @notice Get all report hashes submitted by a user
     * @param user The wallet address to check
     * @return Array of report hashes
     */
    function getUserReports(address user) external view returns (bytes32[] memory) {
        return userReports[user];
    }

    /**
     * @notice Check if a report hash has already been submitted
     * @param reportHash The hash to check
     * @return Whether the report exists
     */
    function isReportSubmitted(bytes32 reportHash) external view returns (bool) {
        return reportExists[reportHash];
    }

    /**
     * @notice Get report details by hash
     * @param reportHash The hash of the report
     * @return submitter The address that submitted the report
     * @return timestamp When the report was submitted
     */
    function getReportDetails(bytes32 reportHash) external view returns (
        address submitter,
        uint256 timestamp
    ) {
        require(reportExists[reportHash], "Report does not exist");
        return (reportSubmitter[reportHash], reportTimestamp[reportHash]);
    }

    /**
     * @notice Update the reward amount per report (owner only)
     * @param newReward The new reward amount in wei
     */
    function setRewardPerReport(uint256 newReward) external onlyOwner {
        rewardPerReport = newReward;
    }

    /**
     * @notice Transfer ownership (owner only)
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
}
