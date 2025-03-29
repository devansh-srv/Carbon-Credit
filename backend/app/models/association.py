from app import db
class AuditorAssociation(db.Model):
    __tablename__ = 'auditor_association'
    credit_id = db.Column(db.Integer, db.ForeignKey('credits.id'), primary_key=True)
    auditor_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
