const db = require("../db");

function sendFriendRequest(req, res) {
  const  sender_user_id = req.userId;
  const { receiver_user_id } = req.body;

  if (!sender_user_id || !receiver_user_id) {
    return res.status(400).json({
      message: "Missing sender_user_id or receiver_user_id"
    });
  }

  if (Number(sender_user_id) === Number(receiver_user_id)) {
    return res.status(400).json({
      message: "You cannot send a friend request to yourself"
    });
  }

  const checkUsersSql = `
    SELECT id
    FROM users
    WHERE id IN (?, ?)
  `;

  db.query(
    checkUsersSql,
    [sender_user_id, receiver_user_id],
    (checkUsersErr, userRows) => {
      if (checkUsersErr) {
        return res.status(500).json({
          message: "Failed to validate users",
          error: checkUsersErr.message
        });
      }

      if (userRows.length !== 2) {
        return res.status(404).json({
          message: "Sender or receiver not found"
        });
      }

      const checkExistingSql = `
        SELECT id, status
        FROM friend_requests
        WHERE
          (sender_user_id = ? AND receiver_user_id = ?)
          OR
          (sender_user_id = ? AND receiver_user_id = ?)
        LIMIT 1
      `;

      db.query(
        checkExistingSql,
        [
          sender_user_id,
          receiver_user_id,
          receiver_user_id,
          sender_user_id
        ],
        (checkExistingErr, existingRows) => {
          if (checkExistingErr) {
            return res.status(500).json({
              message: "Failed to check existing friend request",
              error: checkExistingErr.message
            });
          }

          if (existingRows.length > 0) {
            const existing = existingRows[0];

            if (existing.status === "pending") {
              return res.status(409).json({
                message: "A friend request already exists between these players"
              });
            }

            if (existing.status === "accepted") {
              return res.status(409).json({
                message: "These players are already friends"
              });
            }
          }

          const insertSql = `
            INSERT INTO friend_requests (
              sender_user_id,
              receiver_user_id,
              status
            )
            VALUES (?, ?, 'pending')
          `;

          db.query(
            insertSql,
            [sender_user_id, receiver_user_id],
            (insertErr, insertResult) => {
              if (insertErr) {
                return res.status(500).json({
                  message: "Failed to send friend request",
                  error: insertErr.message
                });
              }

              return res.status(201).json({
                message: "Friend request sent successfully",
                request: {
                  id: insertResult.insertId,
                  sender_user_id: Number(sender_user_id),
                  receiver_user_id: Number(receiver_user_id),
                  status: "pending"
                }
              });
            }
          );
        }
      );
    }
  );
}

function getFriendsList(req, res) {
  const { userId } = req.params;

  const sql = `
    SELECT
      fr.id AS friendship_id,
      CASE
        WHEN fr.sender_user_id = ? THEN u2.id
        ELSE u1.id
      END AS friend_user_id,
      CASE
        WHEN fr.sender_user_id = ? THEN u2.player_name
        ELSE u1.player_name
      END AS player_name,
      CASE
        WHEN fr.sender_user_id = ? THEN u2.faction
        ELSE u1.faction
      END AS faction,
      CASE
        WHEN fr.sender_user_id = ? THEN ls2.ranking_points
        ELSE ls1.ranking_points
      END AS ranking_points,
      CASE
        WHEN fr.sender_user_id = ? THEN ls2.current_rank
        ELSE ls1.current_rank
      END AS current_rank,
      CASE
        WHEN fr.sender_user_id = ? THEN ls2.highest_score
        ELSE ls1.highest_score
      END AS highest_score
    FROM friend_requests fr
    JOIN users u1 ON fr.sender_user_id = u1.id
    JOIN users u2 ON fr.receiver_user_id = u2.id
    LEFT JOIN leaderboard_stats ls1 ON u1.id = ls1.user_id
    LEFT JOIN leaderboard_stats ls2 ON u2.id = ls2.user_id
    WHERE
      fr.status = 'accepted'
      AND (fr.sender_user_id = ? OR fr.receiver_user_id = ?)
    ORDER BY player_name ASC
  `;

  db.query(
    sql,
    [userId, userId, userId, userId, userId, userId, userId, userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to fetch friends list",
          error: err.message
        });
      }

      return res.json({
        friends: results.map((row) => ({
          id: row.friend_user_id,
          player_name: row.player_name,
          faction: row.faction,
          ranking_points: row.ranking_points ?? 0,
          current_rank:
            row.current_rank ??
            getRankFromPoints(row.ranking_points ?? 0, row.faction),
          highest_score: row.highest_score ?? 0
        }))
      });
    }
  );
}

function getIncomingFriendRequests(req, res) {
  const { userId } = req.params;

  const sql = `
    SELECT
      fr.id,
      fr.sender_user_id,
      u.player_name,
      u.faction,
      ls.ranking_points,
      ls.current_rank,
      ls.highest_score,
      fr.created_at
    FROM friend_requests fr
    JOIN users u ON fr.sender_user_id = u.id
    LEFT JOIN leaderboard_stats ls ON u.id = ls.user_id
    WHERE fr.receiver_user_id = ? AND fr.status = 'pending'
    ORDER BY fr.id DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch incoming friend requests",
        error: err.message
      });
    }

    return res.json({
      requests: results.map((row) => ({
        id: row.id,
        sender_user_id: row.sender_user_id,
        player_name: row.player_name,
        faction: row.faction,
        ranking_points: row.ranking_points ?? 0,
        current_rank:
          row.current_rank ??
          getRankFromPoints(row.ranking_points ?? 0, row.faction),
        highest_score: row.highest_score ?? 0,
        created_at: row.created_at
      }))
    });
  });
}

function acceptFriendRequest(req, res) {
  const { requestId } = req.params;
  const  user_id  = req.userId;

  if (!user_id) {
    return res.status(400).json({
      message: "Missing user_id"
    });
  }

  const checkSql = `
    SELECT *
    FROM friend_requests
    WHERE id = ? AND receiver_user_id = ? AND status = 'pending'
    LIMIT 1
  `;

  db.query(checkSql, [requestId, user_id], (checkErr, rows) => {
    if (checkErr) {
      return res.status(500).json({
        message: "Failed to validate friend request",
        error: checkErr.message
      });
    }

    if (!rows.length) {
      return res.status(404).json({
        message: "Friend request not found"
      });
    }

    const updateSql = `
      UPDATE friend_requests
      SET status = 'accepted'
      WHERE id = ?
    `;

    db.query(updateSql, [requestId], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({
          message: "Failed to accept friend request",
          error: updateErr.message
        });
      }

      return res.json({
        message: "Friend request accepted successfully"
      });
    });
  });
}

function rejectFriendRequest(req, res) {
  const { requestId } = req.params;
  const  user_id  = req.userId;

  if (!user_id) {
    return res.status(400).json({
      message: "Missing user_id"
    });
  }

  const checkSql = `
    SELECT *
    FROM friend_requests
    WHERE id = ? AND receiver_user_id = ? AND status = 'pending'
    LIMIT 1
  `;

  db.query(checkSql, [requestId, user_id], (checkErr, rows) => {
    if (checkErr) {
      return res.status(500).json({
        message: "Failed to validate friend request",
        error: checkErr.message
      });
    }

    if (!rows.length) {
      return res.status(404).json({
        message: "Friend request not found"
      });
    }

    const updateSql = `
      UPDATE friend_requests
      SET status = 'rejected'
      WHERE id = ?
    `;

    db.query(updateSql, [requestId], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({
          message: "Failed to reject friend request",
          error: updateErr.message
        });
      }

      return res.json({
        message: "Friend request rejected successfully"
      });
    });
  });
}

function unfriend(req, res) {
  const userId = req.userId; // người gửi yêu cầu hủy kết bạn
  const { friend_user_id } = req.body;

  if (!friend_user_id) {
    return res.status(400).json({ message: "Missing friend_user_id" });
  }

  const sql = `
    DELETE FROM friend_requests
    WHERE status = 'accepted'
      AND (
        (sender_user_id = ? AND receiver_user_id = ?)
        OR
        (sender_user_id = ? AND receiver_user_id = ?)
      )
  `;

  db.query(
    sql,
    [userId, friend_user_id, friend_user_id, userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to unfriend",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Friendship not found" });
      }

      return res.json({ message: "Friend removed successfully" });
    }
  );
}

module.exports = {
  sendFriendRequest,
  getFriendsList,
  getIncomingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend
};