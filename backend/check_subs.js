const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const LeaveRequestSchema = new mongoose.Schema({
    employeeId: mongoose.Schema.Types.ObjectId,
    periodAdjustments: [{
        substituteFacultyId: mongoose.Schema.Types.ObjectId,
        substituteApproval: {
            status: String
        }
    }],
    status: String
});

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String
});

const LeaveRequest = mongoose.model('LeaveRequest', LeaveRequestSchema, 'leaverequests');
const User = mongoose.model('User', UserSchema, 'users');

async function checkData() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const allRequests = await LeaveRequest.find({}).limit(10).sort({ createdAt: -1 });
    console.log('Recent Requests:', JSON.stringify(allRequests, null, 2));

    const users = await User.find({ name: /Soumya/i });
    console.log('Users matching Soumya:', JSON.stringify(users, null, 2));

    if (users.length > 0) {
        const soumyaId = users[0]._id;
        const subsForSoumya = await LeaveRequest.find({
            "periodAdjustments.substituteFacultyId": soumyaId
        });
        console.log(`Substitutions for Soumya (${soumyaId}):`, JSON.stringify(subsForSoumya, null, 2));
    }

    await mongoose.disconnect();
}

checkData().catch(console.error);
