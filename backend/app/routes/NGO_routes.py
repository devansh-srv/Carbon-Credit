from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models.credit import Credit
from app.models.transaction import PurchasedCredit, Transactions
from app.models.user import User
import random
import json
NGO_bp = Blueprint('NGO', __name__)
def get_current_user():
    try:
        return json.loads(get_jwt_identity())
    except json.JSONDecodeError:
        return None

def numberOfAuditors(k) -> int:
    return int((k//500)*2 + 3)

@NGO_bp.route('/api/NGO/credits', methods=['GET', 'POST'])
@jwt_required()


def manage_credits():
    current_user = get_current_user()
    if current_user.get('role') != 'NGO':
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.filter_by(username=current_user.get('username')).first()

    # Ensure only credits created by this NGO are visible
    if request.method == 'GET':
        credits = Credit.query.filter_by(creator_id=user.id).all()
        return jsonify([{
            "id": c.id,
            "name": c.name,
            "amount": c.amount,
            "price": c.price,
            "is_active": c.is_active,
            "is_expired": c.is_expired,
            "creator_id": c.creator_id,
            "secure_url": c.docu_url,
        } for c in credits]), 200

    # Allow the NGO to create new credits
    if request.method == 'POST':
        
        
        #do something regarding the amount 
        data = request.json

        auditors = User.query.filter_by(role = 'auditor').all()
        auditor_ids = [auditor.id for auditor in auditors]
        k = numberOfAuditors(int(data['amount']))
        try:
            selected_auditor_ids = random.sample(auditor_ids, k)
        except ValueError:
            return jsonify({"message": "Not enough auditors"}), 413
        
        new_credit = Credit(
            id=data['creditId'],
            name=data['name'], 
            amount=data['amount'], 
            price=data['price'], 
            creator_id=user.id,
            docu_url = data['secure_url'],
            auditors = selected_auditor_ids,
            req_status = 1
        )
        db.session.add(new_credit)
        db.session.commit()
        return jsonify({"message": "Credit created successfully"}), 201


@NGO_bp.route('/api/NGO/credits/expire/<int:credit_id>', methods=['PATCH'])
@jwt_required()
def expire_credit(credit_id):
    current_user = get_current_user()
    if current_user.get('role') != 'NGO':
        return jsonify({"message": "Unauthorized"}), 403

    user = User.query.filter_by(username=current_user.get('username')).first()
    credit = Credit.query.get(credit_id)
    pc = PurchasedCredit.query.filter_by(credit_id=credit.id).first()

    if not credit:
        return jsonify({"message": "Credit not found"}), 404
    if not pc:
        return jsonify({"message": f"Credit can't be expired as it has not been sold yet, credit with B_ID {credit_id} is not found"}), 400
    # Ensure only the creator NGO can expire the credit
    if credit.creator_id != user.id:
        return jsonify({"message": "You do not have permission to expire this credit"}), 403

    # Expire the credit
    credit.is_active = False
    credit.is_expired = True
    pc.is_expired = True
    db.session.commit()
    return jsonify({"message": "Credit expired successfully"}), 200

@NGO_bp.route('/api/NGO/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    current_user = get_current_user()
    if current_user.get('role') != 'NGO':
        return jsonify({"message": "Unauthorized"}), 403

    transactions = Transactions.query.order_by(Transactions.timestamp.desc()).all()
    transaction_list = []
    for t in transactions:
        transaction_list.append({
            "id": t.id,
            "buyer": t.buyer_id,
            "credit": t.credit_id,
            "amount": t.amount,
            "total_price": t.total_price,
            "timestamp": t.timestamp.isoformat()
        })
    return jsonify(transaction_list)


@NGO_bp.route('/api/NGO/expire-req', methods=['POST'])
@jwt_required()
def check_request():
    data = request.json

    current_user = get_current_user()
    if current_user.get('role') != 'NGO':
        return jsonify({"message": "Unauthorized"}), 403

    username = current_user.get('username')
    # Fetch user details from the database
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    #check if the given password was true 
    if bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({"message": "User verified succesfully! can proceed to expire credit"}), 200
    return jsonify({"message": "Invalid credentials"}), 401
