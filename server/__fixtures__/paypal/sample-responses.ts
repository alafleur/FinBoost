/**
 * PayPal Payout API Response Fixtures
 * Real response structures captured from PayPal Sandbox for testing
 */

export const successfulPayoutResponse = {
  batch_header: {
    payout_batch_id: "5FNCS4PRQYB3E",
    batch_status: "SUCCESS",
    time_created: "2025-01-12T10:30:00Z",
    time_completed: "2025-01-12T10:31:00Z",
    sender_batch_header: {
      sender_batch_id: "cycle-18-20250112-abcd1234",
      email_subject: "FinBoost Reward Payout",
      email_message: "You have received a reward payout from FinBoost!"
    },
    amount: {
      currency: "USD",
      value: "150.00"
    },
    fees: {
      currency: "USD", 
      value: "3.50"
    }
  },
  items: [
    {
      payout_item_id: "ACFTK5Q7WQLP4",
      transaction_status: "SUCCESS",
      payout_item_fee: {
        currency: "USD",
        value: "1.00"
      },
      payout_batch_id: "5FNCS4PRQYB3E",
      payout_item: {
        recipient_type: "EMAIL",
        amount: {
          currency: "USD",
          value: "50.00"
        },
        note: "FinBoost monthly reward",
        receiver: "winner1@example.com",
        sender_item_id: "winner-123-456"
      },
      time_processed: "2025-01-12T10:30:30Z"
    },
    {
      payout_item_id: "BDHUG6R8XRQS5",
      transaction_status: "SUCCESS", 
      payout_item_fee: {
        currency: "USD",
        value: "1.25"
      },
      payout_batch_id: "5FNCS4PRQYB3E",
      payout_item: {
        recipient_type: "EMAIL",
        amount: {
          currency: "USD",
          value: "75.00"
        },
        note: "FinBoost monthly reward",
        receiver: "winner2@example.com",
        sender_item_id: "winner-124-789"
      },
      time_processed: "2025-01-12T10:30:35Z"
    },
    {
      payout_item_id: "CEGWI7S9YTRU6",
      transaction_status: "SUCCESS",
      payout_item_fee: {
        currency: "USD",
        value: "1.25"
      },
      payout_batch_id: "5FNCS4PRQYB3E", 
      payout_item: {
        recipient_type: "EMAIL",
        amount: {
          currency: "USD",
          value: "25.00"
        },
        note: "FinBoost monthly reward",
        receiver: "winner3@example.com",
        sender_item_id: "winner-125-321"
      },
      time_processed: "2025-01-12T10:30:40Z"
    }
  ]
};

export const mixedStatusPayoutResponse = {
  batch_header: {
    payout_batch_id: "6GODB5QS8ZC4F",
    batch_status: "COMPLETED",
    time_created: "2025-01-12T11:00:00Z",
    time_completed: "2025-01-12T11:15:00Z",
    sender_batch_header: {
      sender_batch_id: "cycle-19-20250112-efgh5678",
      email_subject: "FinBoost Reward Payout",
      email_message: "You have received a reward payout from FinBoost!"
    },
    amount: {
      currency: "USD",
      value: "200.00"
    },
    fees: {
      currency: "USD",
      value: "4.75"
    }
  },
  items: [
    {
      payout_item_id: "DFHUJ8T0ZUSV7",
      transaction_status: "SUCCESS",
      payout_item_fee: {
        currency: "USD", 
        value: "1.50"
      },
      payout_batch_id: "6GODB5QS8ZC4F",
      payout_item: {
        recipient_type: "EMAIL",
        amount: {
          currency: "USD",
          value: "100.00"
        },
        note: "FinBoost monthly reward",
        receiver: "success@example.com",
        sender_item_id: "winner-201-501"
      },
      time_processed: "2025-01-12T11:05:00Z"
    },
    {
      payout_item_id: "EGIKV9U1AVTW8",
      transaction_status: "PENDING",
      payout_batch_id: "6GODB5QS8ZC4F",
      payout_item: {
        recipient_type: "EMAIL",
        amount: {
          currency: "USD",
          value: "50.00"
        },
        note: "FinBoost monthly reward",
        receiver: "pending@example.com",
        sender_item_id: "winner-202-502"
      }
    },
    {
      payout_item_id: "FHJLW0V2BWUX9",
      transaction_status: "UNCLAIMED",
      payout_batch_id: "6GODB5QS8ZC4F",
      payout_item: {
        recipient_type: "EMAIL",
        amount: {
          currency: "USD",
          value: "30.00"
        },
        note: "FinBoost monthly reward",
        receiver: "unclaimed@example.com",
        sender_item_id: "winner-203-503"
      }
    },
    {
      payout_item_id: "GIKLX1W3CXVY0",
      transaction_status: "FAILED",
      failure_reason: "RECEIVER_UNREGISTERED",
      payout_batch_id: "6GODB5QS8ZC4F",
      payout_item: {
        recipient_type: "EMAIL",
        amount: {
          currency: "USD",
          value: "20.00"
        },
        note: "FinBoost monthly reward",
        receiver: "invalid@example.com",
        sender_item_id: "winner-204-504"
      },
      errors: {
        name: "RECEIVER_UNREGISTERED",
        message: "Receiver is not registered with PayPal",
        information_link: "https://developer.paypal.com/docs/api/payments.payouts-batch/v1/#errors"
      }
    }
  ]
};

export const failedPayoutResponse = {
  batch_header: {
    payout_batch_id: "7HPEC6RT0AD5G",
    batch_status: "DENIED", 
    time_created: "2025-01-12T12:00:00Z",
    sender_batch_header: {
      sender_batch_id: "cycle-20-20250112-ijkl9012",
      email_subject: "FinBoost Reward Payout",
      email_message: "You have received a reward payout from FinBoost!"
    },
    amount: {
      currency: "USD",
      value: "75.00"
    }
  },
  items: [
    {
      payout_item_id: "HJMNY2X4DYXZ1",
      transaction_status: "DENIED",
      failure_reason: "INSUFFICIENT_FUNDS",
      payout_batch_id: "7HPEC6RT0AD5G",
      payout_item: {
        recipient_type: "EMAIL",
        amount: {
          currency: "USD",
          value: "75.00"
        },
        note: "FinBoost monthly reward",
        receiver: "denied@example.com",
        sender_item_id: "winner-301-601"
      },
      errors: {
        name: "INSUFFICIENT_FUNDS",
        message: "Insufficient funds in the account",
        information_link: "https://developer.paypal.com/docs/api/payments.payouts-batch/v1/#errors"
      }
    }
  ]
};

export const pendingOnlyResponse = {
  batch_header: {
    payout_batch_id: "8IQFD7SU1BE6H",
    batch_status: "PENDING",
    time_created: "2025-01-12T13:00:00Z",
    sender_batch_header: {
      sender_batch_id: "cycle-21-20250112-mnop3456",
      email_subject: "FinBoost Reward Payout", 
      email_message: "You have received a reward payout from FinBoost!"
    },
    amount: {
      currency: "USD",
      value: "125.00"
    }
  },
  items: [
    {
      payout_item_id: "IKNOZ3Y5EZYA2",
      transaction_status: "PENDING",
      payout_batch_id: "8IQFD7SU1BE6H",
      payout_item: {
        recipient_type: "EMAIL",
        amount: {
          currency: "USD",
          value: "60.00"
        },
        note: "FinBoost monthly reward",
        receiver: "pending1@example.com",
        sender_item_id: "winner-401-701"
      }
    },
    {
      payout_item_id: "JLOPA4Z6FAZB3",
      transaction_status: "ONHOLD",
      payout_batch_id: "8IQFD7SU1BE6H",
      payout_item: {
        recipient_type: "EMAIL",
        amount: {
          currency: "USD",
          value: "65.00"
        },
        note: "FinBoost monthly reward",
        receiver: "onhold@example.com",
        sender_item_id: "winner-402-702"
      }
    }
  ]
};