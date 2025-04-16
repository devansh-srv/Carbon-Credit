from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models.credit import Credit
from app.models.request import Request
from app.models.transaction import PurchasedCredit, Transactions 
from app.models.user import User
from app.utilis.redis import get_redis
import json
auditor_bp = Blueprint('auditor', __name__)
redis_client = get_redis()
def get_current_user():
    try:
        return json.loads(get_jwt_identity())
    except json.JSONDecodeError:
        return None

@auditor_bp.route('/api/auditor/credits', methods=['GET'])
@jwt_required()
def manage_credits():
    current_user = get_current_user()
    if current_user.get('role') != 'auditor':
        return jsonify({"message": "Unauthorized"}), 403
    user = User.query.filter_by(username=current_user.get('username')).first()
    # key = user.username
    requests = Request.query.filter(Request.auditors.contains([user.id])).all()
    
    credit_ids = [r.credit_id for r in requests]

    credits = Credit.query.filter(Credit.id.in_(credit_ids)).all()
    data = [{
        "id": credit.id,
        "name": credit.name,
        "amount": credit.amount,
        "price": credit.price,
        "is_active": credit.is_active,
        "is_expired": credit.is_expired,
        "secure_url": credit.docu_url
    }for credit in credits]
    return jsonify(data), 200

@auditor_bp.route('/api/auditor/audit/<int:credit_id>', methods=['PATCH'])
@jwt_required()
def audit_credit(credit_id):
    current_user = get_current_user()
    if current_user.get('role') != 'auditor':
        return jsonify({"message": "Unauthorized"}), 403
    
    data = request.json

    
    # print("credit id", credit_id)
    user = User.query.filter_by(username=current_user.get('username')).first()
    request_obj = Request.query.filter_by(credit_id=credit_id).first()
    cid = request_obj.creator_id
    print(f"creator_id: {cid}")
    cu_ngo = User.query.filter_by(id =cid).first()
    key = cu_ngo.username
    print(f"key: {key}")
    if redis_client:
        try:
            redis_client.delete(key)
            print("deleted cached credits")
        except:
            pass

    if not request_obj or user.id not in request_obj.auditors:
        return jsonify({"message": "Not assigned or already audited"}), 404

    
    if(data['vote']):
        request_obj.score += 1
    else:
        request_obj.score -= 1

    
    # Remove auditor
    request_obj.auditors.remove(user.id)

    # If no auditors left, update req_status in Credit table
    if len(request_obj.auditors) == 0:
        credit = Credit.query.filter_by(id=credit_id).first()
        if credit:
            credit.req_status = 2
            
    db.session.commit()

    return jsonify({"message": f"Audit completed, vote: {data['vote']}"}), 200
