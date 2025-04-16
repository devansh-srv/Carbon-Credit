def generate_certificate_data(purchase_id, user, purchased_credit, credit, transaction):
    return {
        "certificate_id": f"CC-{purchase_id}-{user.id}-{credit.id-1}",
        "buyer_name": user.username,
        "credit_name": credit.name,
        "amount": purchased_credit.amount,
        "purchase_date": purchased_credit.purchase_date.strftime("%Y-%m-%d"),
        "transaction_hash": transaction.txn_hash,
        "certificate_html": f"""
            <div style="
                border: 4px double #2c3e50; 
                border-radius: 15px; 
                padding: 30px; 
                max-width: 700px; 
                margin: 0 auto; 
                font-family: 'Arial', sans-serif; 
                background: linear-gradient(to bottom right, #f0f0f0, #ffffff);
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                position: relative;
                overflow: hidden;
            ">
                <!-- Decorative Elements -->
                <div style="
                    position: absolute; 
                    top: 0; 
                    left: 0; 
                    right: 0; 
                    height: 15px; 
                    background: linear-gradient(to right, #2ecc71, #3498db);
                "></div>
                <div style="
                    position: absolute; 
                    bottom: 0; 
                    left: 0; 
                    right: 0; 
                    height: 15px; 
                    background: linear-gradient(to right, #3498db, #2ecc71);
                "></div>
                
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://i.ibb.co/TDn711NW/leaf-8993153.png" alt="Website Logo" style="max-width: 50px; height: auto;">
                </div>

                <!-- Certificate Content -->
                <h1 style="
                    font-family: 'Georgia', serif; 
                    text-align: center; 
                    color: #2c3e50; 
                    margin-bottom: 20px; 
                    font-size: 2.5em; 
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                ">Carbon Credit Certificate</h1>

                <div style="text-align: center; margin-bottom: 20px; color: #34495e;">
                    <p style="font-size: 1em; margin-bottom: 10px;">This certifies that</p>
                    <h2 style="
                        font-family: 'Palatino Linotype', serif; 
                        color: #2c3e50; 
                        font-size: 2em; 
                        margin-bottom: 15px;
                    ">{user.username}</h2>
                    <p style="font-size: 1em; margin-bottom: 10px;">has purchased</p>
                    <h3 style="
                        font-family: 'Palatino Linotype', serif; 
                        color: #16a085; 
                        font-size: 1.5em; 
                        margin-bottom: 15px;
                    ">{credit.name}</h3>
                    <p style="font-size: 1em; margin-bottom: 10px;">
                        on {purchased_credit.purchase_date.strftime("%B %d, %Y")}
                    </p>
                    <p style="font-size: 1em; margin-bottom: 20px;">
                        and has helped offset <strong>{credit.amount} tons</strong> of carbon with <strong>ETH {credit.price}</strong>
                    </p>
                </div>

                <div style="
                    margin-top: 40px; 
                    text-align: center; 
                    font-family: 'Courier New', monospace;
                    color: #7f8c8d;
                ">
                    <p style="
                        border-top: 1px solid #bdc3c7; 
                        padding-top: 15px; 
                        margin-bottom: 15px;
                        display: inline-block;
                        word-break: break-all;
                        max-width: 90%;
                    ">
                        Transaction Hash: {transaction.txn_hash}
                    </p>
                    <p style="
                        padding-bottom: 15px;
                        display: inline-block;
                        width: 90%
                    ">
                        Certificate ID: CC-{purchase_id}-{user.id}-{credit.id}
                    </p>
                    <p style="
                        padding-bottom: 15px;
                        border-bottom: 1px solid #bdc3c7;
                        display: inline-block;
                        width: 90%
                    ">
                        Credit ID: CC-{credit.id}
                    </p>
                </div>
            </div>
        """
    }
