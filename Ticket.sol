// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EventTicketBooking {
    enum EventType { Concert, Conference, Exhibition, Business }
    
    struct Ticket {
        uint256 id;
        EventType eventType;
        uint256 price;
        uint256 quantity;
        address owner;
        bool isValid;
        uint256 purchaseTime;
    }
    
    mapping(uint256 => Ticket) public tickets;
    mapping(address => uint256[]) public userTickets;
    uint256 public ticketCounter;
    
    event TicketPurchased(
        uint256 ticketId,
        EventType eventType,
        uint256 price,
        uint256 quantity,
        address owner,
        uint256 purchaseTime
    );
    
    event TicketValidated(uint256 ticketId, bool isValid);
    
    function purchaseTicket(
        EventType _eventType,
        uint256 _price,
        uint256 _quantity
    ) external payable {
        require(_quantity > 0, "Quantity must be at least 1");
        require(msg.value == _price * _quantity, "Incorrect payment amount");
        
        ticketCounter++;
        tickets[ticketCounter] = Ticket({
            id: ticketCounter,
            eventType: _eventType,
            price: _price,
            quantity: _quantity,
            owner: msg.sender,
            isValid: true,
            purchaseTime: block.timestamp
        });
        
        userTickets[msg.sender].push(ticketCounter);
        
        emit TicketPurchased(
            ticketCounter,
            _eventType,
            _price,
            _quantity,
            msg.sender,
            block.timestamp
        );
    }
    
    function validateTicket(uint256 _ticketId) external view returns (bool) {
        require(tickets[_ticketId].id != 0, "Ticket does not exist");
        return tickets[_ticketId].isValid;
    }
    
    function invalidateTicket(uint256 _ticketId) external {
        require(tickets[_ticketId].owner == msg.sender, "Not ticket owner");
        tickets[_ticketId].isValid = false;
        emit TicketValidated(_ticketId, false);
    }
    
    function getUserTickets() external view returns (Ticket[] memory) {
        uint256[] storage ticketIds = userTickets[msg.sender];
        Ticket[] memory userTicketList = new Ticket[](ticketIds.length);
        
        for (uint256 i = 0; i < ticketIds.length; i++) {
            userTicketList[i] = tickets[ticketIds[i]];
        }
        
        return userTicketList;
    }
    
    function getEventName(EventType _eventType) public pure returns (string memory) {
        if (_eventType == EventType.Concert) return "Concert";
        if (_eventType == EventType.Conference) return "Conference";
        if (_eventType == EventType.Exhibition) return "Exhibition";
        if (_eventType == EventType.Business) return "Business Event";
        return "Unknown";
    }
}