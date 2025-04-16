from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
from app.models.credit import Credit
from app.models.transaction import PurchasedCredit
from app.models.transaction import Transactions
from app.utilis.redis import get_redis
from app.utilis.certificate_generator import generate_certificate_data
import json
import io
import base64
from weasyprint import HTML
from app import db

buyer_bp = Blueprint('buyer_bp', __name__)
redis_client = get_redis()
def get_current_user():
    try:
        return json.loads(get_jwt_identity())
    except json.JSONDecodeError:
        return None

@buyer_bp.route('/api/buyer/credits', methods=['GET'])
@jwt_required()
def buyer_credits():
    key = "buyer_credits"
    if redis_client:
        try:
            cached_credits = redis_client.get(key)
            if cached_credits:
                print("cache hit buyer_credits")
                return jsonify(json.loads(cached_credits))
            else:
                print("cache miss buyer_credits")
        except Exception as e:
            print(f"redis get client error: {e}")
    credits = Credit.query.filter_by(is_active =True).all()
    data = [{"id": c.id, "name": c.name, "amount": c.amount, "price": c.price,"creator":c.creator_id, "secure_url": c.docu_url} for c in credits]
    if redis_client:
        try:
            redis_client.set(key, json.dumps(data))
            print("buyer_credits cached")
        except:
            pass
    return jsonify(data)

@buyer_bp.route('/api/buyer/purchase', methods=['POST'])
@jwt_required()
def purchase_credit():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Invalid token"}), 401

    data = request.json
    if not data or 'credit_id' not in data:
        return jsonify({"message": "Missing credit_id"}), 400
    # print(data) 
    if 'txn_hash' not in data:
        return jsonify({"message": "Missing txn_hash"}), 400

    # Retrieve the credit
    credit = Credit.query.get(data['credit_id'])
    if not credit:
        return jsonify({"message": "Credit not found"}), 404

    # Check if the current user exists
    user = User.query.filter_by(username=current_user['username']).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Check if the credit already exists in the purchased_credits table
    existing_credit = PurchasedCredit.query.filter_by(credit_id=credit.id).first()
    if existing_credit:
        db.session.delete(existing_credit)

    # Add new entry to purchased_credits
    purchased_credit = PurchasedCredit(
        user_id=user.id,
        credit_id=credit.id,
        amount=credit.amount,
        creator_id=credit.creator_id,
    )

    # Record the transaction
    transaction = Transactions(
        buyer_id=user.id,
        credit_id=credit.id,
        amount=credit.amount,
        total_price=credit.price,
        txn_hash=data['txn_hash']
    )
    key = "buyer_credits"
    if redis_client:
        try:
            redis_client.delete(key)
        except Exception as e:
            print(f"redis get client error: {e}")
    # Update the credit to inactive
    credit.is_active = False

    # Add and commit the changes
    db.session.add(purchased_credit)
    db.session.add(transaction)
    db.session.commit()

    return jsonify({"message": "Credit purchased successfully"}), 200


@buyer_bp.route('/api/buyer/sell', methods=['PATCH'])
@jwt_required()
def sell_credit():
    # get creditId from request and in credits DB set is_active == true for object that same id

    current_user  = get_current_user()
    if not current_user:
        return jsonify({"message" : "Invalid token"}),401

    # Parse request data
    data = request.json
    if not data or 'credit_id' not in data or 'salePrice' not in data:
        return jsonify({"message": "Missing credit_id or salePrice"}), 400

    credit = Credit.query.get(data['credit_id'])
    if credit:
        credit.is_active = True
        credit.price = data['salePrice']

        if(credit.req_status != 3):
            credit.req_status = 3
            
        db.session.commit()

        return jsonify({"message": f"Credit put to sale with price {data['salePrice']}" }), 200
    return jsonify({"message": "Can't sell at this point"}), 400

@buyer_bp.route('/api/buyer/remove-from-sale', methods=['PATCH'])
@jwt_required()
def remove_credit():
    # get creditId from request and in credits DB set is_active == false for object with same id
    current_user  = get_current_user()
    if not current_user:
        return jsonify({"message" : "Invalid token"}),401

    # Parse request data
    data = request.json
    if not data or 'credit_id' not in data:
        return jsonify({"message": "Missing credit_id"}), 404

    credit = Credit.query.get(data['credit_id'])
    if credit:
        credit.is_active = False
        db.session.commit()

        return jsonify({"message": "Credit removed from sale" }), 200
    return jsonify({"message": "For some reason cant remove from sale, man if error is coming here we are cooked"}), 400

@buyer_bp.route('/api/buyer/purchased', methods=['GET'])
@jwt_required()
def get_purchased_credits():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Invalid token"}), 401

    user = User.query.filter_by(username=current_user['username']).first()
    key = user.username
    if redis_client:
        try:
            cached_purchased = redis_client.get(key)
            if cached_purchased:
                return jsonify(json.loads(cached_purchased)), 200
        except Exception as e:
            print(f"redis get client error: {e}")

    purchased_credits = PurchasedCredit.query.filter_by(user_id=user.id).all()
    credits = []
    for pc in purchased_credits:
        credit = Credit.query.get(pc.credit_id)
        creator = User.query.get(pc.creator_id) if pc.creator_id else None
        credits.append({
            "id": credit.id,
            "name": credit.name,
            "amount": pc.amount,
            "price": credit.price,
            "is_active": credit.is_active,
            "is_expired": credit.is_expired,
            "creator": {
                "id": creator.id,
                "username": creator.username,
                "email": creator.email
            } if creator else None
        })
        if redis_client:
            try:
                redis_client.set(key,json.dumps(credits),ex=1)
                print("puchased cached")
            except:
                pass
    return jsonify(credits), 200

@buyer_bp.route('/api/buyer/generate-certificate/<int:creditId>', methods=['GET'])
@jwt_required()
def generate_certificate(creditId):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Invalid token"}), 401
    
    user = User.query.filter_by(username=current_user['username']).first()
    purchased_credit = PurchasedCredit.query.filter_by(credit_id=creditId, user_id=user.id).first()
    if not purchased_credit:
        return jsonify({"message": f"Credit with {creditId} was never purchased"}), 404

    credit = Credit.query.get(purchased_credit.credit_id)
    if credit is None:
        return jsonify({"message":"No such credit found"}),404

    transaction = Transactions.query.filter_by(credit_id=purchased_credit.credit_id).order_by(Transactions.timestamp.desc()).first()
    if transaction is None:
        return jsonify({"message": f"Respective transaction with {purchased_credit.credit_id} not found"}), 404
    
    certificate_data = generate_certificate_data(purchased_credit.id, user, purchased_credit, credit, transaction) if credit.is_expired else None
    if certificate_data is None:
        return jsonify({"message":f"No credit with {credit.id} has expired"}), 404
    
    return jsonify(certificate_data), 200
@buyer_bp.route('/api/buyer/download-certificate/<int:creditId>',methods=['GET'])
@jwt_required()
def download_certificate(creditId):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Invalid token"}), 401
    
    user = User.query.filter_by(username=current_user['username']).first()
    purchased_credit = PurchasedCredit.query.filter_by(credit_id=creditId, user_id=user.id).first()
    if not purchased_credit:
        return jsonify({"message": f"Credit with {creditId} was never purchased"}), 404

    credit = Credit.query.get(purchased_credit.credit_id)
    if credit is None:
        return jsonify({"message":"No such credit found"}),404
    transaction = Transactions.query.filter_by(credit_id=purchased_credit.credit_id).order_by(Transactions.timestamp.desc()).first()
    if transaction is None:
        return jsonify({"message": "Respective transaction not found"}), 404
    # creator = User.query.get(purchased_credit.creator_id) if purchased_credit.creator_id else None
    
    certificate_data = generate_certificate_data(purchased_credit.id, user, purchased_credit, credit, transaction) if credit.is_expired else None
    if certificate_data is None:
        return jsonify({"message":f"No credit with {credit.id} has expired"}), 404
    
    output_buffer = io.BytesIO()
    html_content = certificate_data['certificate_html']
    HTML(string=html_content).write_pdf(output_buffer)
    output_buffer.seek(0)
    return jsonify({
        "filename":f"Carbon_Credit_Certificate_{purchased_credit.id}.pdf",
        "pdf_base64":base64.b64encode(output_buffer.getvalue()).decode('utf-8')
    })

@buyer_bp.route('/api/buyer/credits/<int:credit_id>', methods=['GET'])
@jwt_required()
def get_credit_details(credit_id):
    try:
        credit = Credit.query.get_or_404(credit_id)
        # Fetch usernames for auditors
        auditors = credit.auditors or []
        auditor_users = User.query.filter(User.id.in_(auditors)).all()
        auditor_usernames = {user.id: user.username for user in auditor_users}
        # Map auditor IDs to usernames, preserving order
        auditor_list = [
            {"id": auditor_id, "username": auditor_usernames.get(auditor_id, "Unknown")}
            for auditor_id in auditors
        ]

        return jsonify({
            "id": credit.id,
            "name": credit.name,
            "amount": credit.amount,
            "price": credit.price,
            "is_active": credit.is_active,
            "is_expired": credit.is_expired,
            "creator_id": credit.creator_id,
            "docu_url": credit.docu_url,
            "auditors": auditor_list,  # Return list of {id, username}
            "req_status": credit.req_status
        })
    except Exception as e:
        return jsonify({"error": "Credit not found"}), 404
