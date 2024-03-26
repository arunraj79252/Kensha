
const getStatusName = (status) => {
  let statusName;
  try {
    switch (status) {
      case 0:
        statusName = "Applied";
        break;
      case 1:
        statusName = "Review started";
        break;
      case 2:
        statusName = "Transaction pending";
        break;
      case 3:
        statusName = "Rejected";
        break;
      case 4:
        statusName = "Approved";
        break;
      case 5:
        statusName = "Resubmitted";
        break;
      case 6:
        statusName = "Ready for payment";
        break;
      case 7:
        statusName = "Payment Pending";
        break;
      case 8:
        statusName = "Payment Failed";
        break;
      default:
        statusName = "";
    }
    return statusName;
  } catch (error) {
    console.log(error);
  }
}
export default getStatusName;
