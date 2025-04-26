// Contract ABI (Generated from Solidity compiler)
const contractABI = [
    {
        "inputs": [],
        "name": "getUserTickets",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "enum EventTicketBooking.EventType",
                        "name": "eventType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "quantity",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "internalType": "bool",
                        "name": "isValid",
                        "type": "bool"
                    },
                    {
                        "internalType": "uint256",
                        "name": "purchaseTime",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct EventTicketBooking.Ticket[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_ticketId",
                "type": "uint256"
            }
        ],
        "name": "invalidateTicket",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum EventTicketBooking.EventType",
                "name": "_eventType",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "_price",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_quantity",
                "type": "uint256"
            }
        ],
        "name": "purchaseTicket",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_ticketId",
                "type": "uint256"
            }
        ],
        "name": "validateTicket",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum EventTicketBooking.EventType",
                "name": "_eventType",
                "type": "uint8"
            }
        ],
        "name": "getEventName",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    }
];

// Contract address (replace with your deployed contract address)
const contractAddress = "0x2310E234a6D2EF320B4AdcB4Ea283b2789ac3B16";

let web3;
let contract;
let account;
let currentTicketId;

// Event type names
const eventTypes = ["Concert", "Conference", "Exhibition", "Business Event"];

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Check if Web3 is injected
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            await initApp();
        } catch (error) {
            console.error("User denied account access");
        }
    } else {
        alert("Please install MetaMask to use this application!");
    }
    
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.querySelectorAll('.book-btn').forEach(btn => {
        btn.addEventListener('click', showBookingModal);
    });
    document.getElementById('ticketQuantity').addEventListener('input', updateTotalPrice);
    document.getElementById('confirmBooking').addEventListener('click', confirmBooking);
    document.getElementById('invalidateTicket').addEventListener('click', invalidateTicket);
    document.getElementById('aboutButton').addEventListener('click', () => {
        const aboutModal = new bootstrap.Modal(document.getElementById('aboutModal'));
        aboutModal.show();
    });
});

// Connect wallet
async function connectWallet() {
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        account = accounts[0];
        document.getElementById('accountAddress').textContent = account;

        // เปลี่ยนปุ่มเป็น "Logout" พร้อมไอคอน
        const connectWalletButton = document.getElementById('connectWallet');
        connectWalletButton.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i>Logout';
        connectWalletButton.classList.remove('btn-gradient');
        connectWalletButton.classList.add('btn-danger');
        connectWalletButton.removeEventListener('click', connectWallet);
        connectWalletButton.addEventListener('click', logoutWallet);

        // Initialize the app
        await initApp();
    } catch (error) {
        console.error("Error connecting wallet:", error);
        alert('Failed to connect wallet. Please try again.');
    }
}

// Logout wallet
function logoutWallet() {
    account = null;
    document.getElementById('accountAddress').textContent = 'Not connected';


    const connectWalletButton = document.getElementById('connectWallet');
    connectWalletButton.innerHTML = '<i class="fas fa-wallet me-2"></i>Connect Wallet';
    connectWalletButton.classList.remove('btn-danger');
    connectWalletButton.classList.add('btn-gradient');
    connectWalletButton.removeEventListener('click', logoutWallet);
    connectWalletButton.addEventListener('click', connectWallet);

    alert('You have been logged out.');
}

// Initialize the application after wallet connection
async function initApp() {
    // ตรวจสอบว่ามีบัญชีที่เชื่อมต่อหรือไม่
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
        account = null;
        document.getElementById('accountAddress').textContent = 'Not connected';
        await loadUserTickets(); // แสดงข้อความแจ้งเตือนในกรณีที่ยังไม่ได้เชื่อมต่อ
        return;
    }

    account = accounts[0];
    document.getElementById('accountAddress').textContent = account;

    // Initialize contract
    contract = new web3.eth.Contract(contractABI, contractAddress);

    // Load user tickets
    await loadUserTickets();
}

// Show booking modal
function showBookingModal(event) {
    if (!account) {
        alert('Please connect your wallet first!');
        return; // หยุดการทำงานหากยังไม่ได้เชื่อมต่อกระเป๋าเงิน
    }

    const button = event.currentTarget;
    const eventType = parseInt(button.getAttribute('data-event'));
    const price = button.getAttribute('data-price');
    
    document.getElementById('eventName').value = eventTypes[eventType];
    document.getElementById('ticketPrice').value = price;
    document.getElementById('ticketQuantity').value = 1;
    updateTotalPrice();
    
    // Store event data in modal for later use
    const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
    modal._element.setAttribute('data-event-type', eventType);
    modal._element.setAttribute('data-price', price);
    modal.show();
}

// Update total price when quantity changes
function updateTotalPrice() {
    const quantity = parseInt(document.getElementById('ticketQuantity').value);
    const price = parseFloat(document.getElementById('ticketPrice').value);
    const total = (quantity * price).toFixed(2);
    document.getElementById('totalPrice').value = total;
}

// Confirm booking
async function confirmBooking() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
    const eventType = parseInt(modal._element.getAttribute('data-event-type'));
    const price = modal._element.getAttribute('data-price');
    const quantity = parseInt(document.getElementById('ticketQuantity').value);
    
    // Convert price to wei
    const priceInWei = web3.utils.toWei(price, 'ether');
    const totalInWei = web3.utils.toWei((price * quantity).toString(), 'ether');
    
    try {
        await contract.methods.purchaseTicket(
            eventType,
            priceInWei,
            quantity
        ).send({
            from: account,
            value: totalInWei
        });
        
        modal.hide();
        await loadUserTickets();
        
        // Show success message
        alert('Ticket purchased successfully!');
    } catch (error) {
        console.error("Error purchasing ticket:", error);
        alert('Error purchasing ticket: ' + error.message);
    }
}

// Load user tickets
async function loadUserTickets() {
    const container = document.getElementById('ticketsContainer');

    // ตรวจสอบว่าผู้ใช้ได้เชื่อมต่อกระเป๋าเงินหรือยัง
    if (!account) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">Please connect your wallet to view your tickets.</div>
            </div>
        `;
        return; // หยุดการทำงานหากยังไม่ได้เชื่อมต่อกระเป๋าเงิน
    }

    try {
        const tickets = await contract.methods.getUserTickets().call({ from: account });

        if (tickets.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">No tickets purchased yet.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        tickets.forEach(ticket => {
            const eventName = eventTypes[ticket.eventType];
            const priceInEth = web3.utils.fromWei(ticket.price, 'ether');
            const totalPrice = (priceInEth * ticket.quantity).toFixed(4);
            const purchaseDate = new Date(ticket.purchaseTime * 1000).toLocaleString();

            const ticketElement = document.createElement('div');
            ticketElement.className = 'col-md-6';
            ticketElement.innerHTML = `
                <div class="ticket-card">
                    <div class="ticket-header">
                        <span>${eventName} Ticket #${ticket.id}</span>
                        <span class="${ticket.isValid ? 'ticket-valid' : 'ticket-invalid'}">
                            ${ticket.isValid ? 'VALID' : 'INVALID'}
                        </span>
                    </div>
                    <div class="ticket-detail"><strong>Quantity:</strong> ${ticket.quantity}</div>
                    <div class="ticket-detail"><strong>Price per ticket:</strong> ${priceInEth} ETH</div>
                    <div class="ticket-detail"><strong>Total paid:</strong> ${totalPrice} ETH</div>
                    <div class="ticket-detail"><strong>Purchased on:</strong> ${purchaseDate}</div>
                    <button class="btn btn-outline-primary btn-sm mt-2 view-detail-btn" data-ticket-id="${ticket.id}">
                        <i class="fas fa-info-circle me-1"></i> View Details
                    </button>
                </div>
            `;

            container.appendChild(ticketElement);
        });

        // Add event listeners to view detail buttons
        document.querySelectorAll('.view-detail-btn').forEach(btn => {
            btn.addEventListener('click', showTicketDetails);
        });
    } catch (error) {
        console.error("Error loading tickets:", error);
    }
}

// Show ticket details
async function showTicketDetails(event) {
    const ticketId = event.currentTarget.getAttribute('data-ticket-id');
    currentTicketId = ticketId;
    
    try {
        const ticket = await contract.methods.validateTicket(ticketId).call({ from: account });
        const ticketDetails = await contract.methods.tickets(ticketId).call({ from: account });
        
        const eventName = eventTypes[ticketDetails.eventType];
        const priceInEth = web3.utils.fromWei(ticketDetails.price, 'ether');
        const totalPrice = (priceInEth * ticketDetails.quantity).toFixed(4);
        const purchaseDate = new Date(ticketDetails.purchaseTime * 1000).toLocaleString();
        const owner = ticketDetails.owner;
        const isValid = ticketDetails.isValid ? 'Yes' : 'No';
        
        document.getElementById('ticketDetailContent').innerHTML = `
            <div class="mb-3">
                <h6>Ticket Information</h6>
                <hr>
                <p><strong>Ticket ID:</strong> ${ticketId}</p>
                <p><strong>Event:</strong> ${eventName}</p>
                <p><strong>Quantity:</strong> ${ticketDetails.quantity}</p>
                <p><strong>Price per ticket:</strong> ${priceInEth} ETH</p>
                <p><strong>Total paid:</strong> ${totalPrice} ETH</p>
                <p><strong>Purchase date:</strong> ${purchaseDate}</p>
                <p><strong>Owner:</strong> ${owner}</p>
                <p><strong>Valid:</strong> ${isValid}</p>
            </div>
            <div class="alert ${ticketDetails.isValid ? 'alert-success' : 'alert-danger'}">
                This ticket is currently ${ticketDetails.isValid ? 'valid' : 'invalid'} for entry.
            </div>
        `;
        
        const invalidateBtn = document.getElementById('invalidateTicket');
        invalidateBtn.disabled = !ticketDetails.isValid;
        
        const modal = new bootstrap.Modal(document.getElementById('ticketDetailModal'));
        modal.show();
    } catch (error) {
        console.error("Error loading ticket details:", error);
        alert('This Function Not Disable Now: ' + error.message);
    }
}

// Invalidate ticket
async function invalidateTicket() {
    try {
        await contract.methods.invalidateTicket(currentTicketId).send({ from: account });
        
        // Refresh ticket details and list
        await loadUserTickets();
        const modal = bootstrap.Modal.getInstance(document.getElementById('ticketDetailModal'));
        modal.hide();
        
        alert('Ticket has been invalidated successfully!');
    } catch (error) {
        console.error("Error invalidating ticket:", error);
        alert('Error invalidating ticket: ' + error.message);
    }
}