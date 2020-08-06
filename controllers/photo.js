const connection = require("../db/mysql_connection");
const path = require("path");

// @desc 사진1장과 내용을 업로드 하는 API
// @route PUT /api/v1/user/photo
// @request photo, comment, user_id(auth)
// @response success

// 클라이언트가 사진을 보낸다. => 서버가 이 사진을 받는다. =>
// 서버가 이 사진을 디렉토리에 저장한다. => 이 사진의 파일명을 DB에 저장한다.

exports.PhotoUpload = async (req, res, next) => {
  let user_id = req.user.id;

  if (!user_id || !req.files) {
    res.status(400).json({ message: "hi" });
    return;
  }
  const photo = req.files.photo;
  const comment = req.body.comment;
  console.log(req.files);
  console.log(req.body);
  // 지금 받은 파일이, 이미지 파일인지 체크.
  if (photo.mimetype.startsWith("image") == false) {
    res.status(400).json({ message: "이미지 파일이 아닙니다." });
    return;
  }
  if (photo.size > process.env.MAX_FILE_SIZE) {
    res.status(400).json({ message: "파일크기가 정해진것보다 큽니다." });
    return;
  }
  // fall.jpg => photo_3.jpg
  // abc.png => photo_3.png
  photo.name = `photo_${user_id}_${Date.now()}${path.parse(photo.name).ext}`;
  // 저장할 경로 셋팅 : ./public/upload/photo_3.jpg
  let fileUploadPath = `${process.env.FILE_UPLOAD_PATH}/${photo.name}`;
  console.log(photo.name);

  // 파일을 우리가 지정한 경로에 저장.
  photo.mv(fileUploadPath, async (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  // db에 이 파일이름을 업데이트 한다.
  let query = `insert into photo (photo_url, comment , user_id) values ("${photo.name}", "${comment}",${user_id})`;
  console.log(query);
  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, e });
  }
  res.status(200).json();
};

// @desc 내가 쓴 포스트 정보 가져오기(25개씩)
// @route GET /api/v1/posts

exports.getMyPhotos = async (req, res, next) => {
  let user_id = req.user.id;
  let offset = req.query.offset;
  let limit = req.query.limit;

  if (!user_id || !offset || !limit) {
    res.status(400).json({ message: "파라미터가 잘 못 되었습니다." });
  }
  console.log(user_id);
  console.log(offset);
  console.log(limit);

  let query = `select * from photo where user_id = ${user_id} limit ${offset}, ${limit}`;
  console.log(query);

  try {
    [rows] = await connection.query(query);
    res.status(200).json({ success: true, items: rows, cnt: rows.length });
  } catch (e) {
    res.status(400).json({ success: false });
  }
};

// @desc 포스팅 수정하기
// @route PUT api/v1/photo/:photo_id
// @request user_id(auth), photo, comment
// @response sucess

exports.updatePhoto = async (req, res, next) => {
  let photo_id = req.params.photo_id;
  let user_id = req.user.id;
  let photo = req.files.photo;
  let comment = req.body.comment;

  // 이 사람의 포스팅을 변경하는 것인지, 확인한다.

  let query = `select * from photo where id = ${photo_id} `;
  let data = [photo_id];
  console.log(query);
  console.log(user_id);
  console.log(photo);
  console.log(comment);

  try {
    [rows] = await connection.query(query, data);
    // 다른사람이 쓴 글을, 이 사람이 바꾸려고 하면, 401로 보낸다.
    if (rows[0].user_id != user_id) {
      res.status(401).json();
      return;
    }
  } catch (e) {
    res.status(500).json();
  }

  // 지금 받은 파일이, 이미지 파일인지 체크.
  if (photo.mimetype.startsWith("image") == false) {
    res.status(400).json({ message: "이미지 파일이 아닙니다." });
    return;
  }
  if (photo.size > process.env.MAX_FILE_SIZE) {
    res.status(400).json({ message: "파일크기가 정해진것보다 큽니다." });
    return;
  }
  // fall.jpg => photo_3.jpg
  // abc.png => photo_3.png
  photo.name = `photo_${user_id}_${Date.now()}${path.parse(photo.name).ext}`;
  // 저장할 경로 셋팅 : ./public/upload/photo_3.jpg
  let fileUploadPath = `${process.env.FILE_UPLOAD_PATH}/${photo.name}`;
  console.log(photo.name);

  // 파일을 우리가 지정한 경로에 저장.
  photo.mv(fileUploadPath, async (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });

  query = `update photo set photo_url = "${photo.name}" , comment = "${comment}" where id = ${photo_id}`;
  console.log(query);
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

  try {
    [result] = await connection.query(query);
    console.log("@!!!!!@#!@#@!#!@#!@#@!#");
    res.status(200).json({ success: true });
  } catch (e) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    res.status(400).json({ success: false, e });
  }
};

// @desc    내 포스팅 삭제하기 (1개)
// @route   DELETE /api/v1/posts/:photo_id
// @request photo_id, user_id(auth)
// @response  success

exports.deletePhoto = async (req, res, next) => {
  let photo_id = req.params.photo_id;
  let user_id = req.user.id;

  if (!photo_id || !user_id) {
    res.status(400).json({ message: "파라미터가 잘못 되었습니다." });
    return;
  }

  // 이 사람의 포스팅이 맞는지 확인하는 코드 // 시작
  let query = "select * from photo where id = ? ";
  let data = [photo_id];

  try {
    [rows] = await connection.query(query, data);
    // 다른사람 포스팅이면, 401로 보낸다.
    if (rows[0].user_id != user_id) {
      req.status(401).json();
      return;
    }
  } catch (e) {
    res.status(500).json();
    return;
  }
  // 이 사람의 포스팅이 맞는지 확인하는 코드 // 끝.

  query = `delete from photo where id = ${photo_id}`;

  try {
    [result] = await connection.query(query);
    res.status(200).json({ success: true });
    return;
  } catch (e) {
    res.status(500).json;
    return;
  }
};

// @desc 내 친구들의 포스팅 불러오기 (25개씩)
// @route GET /api/v1/photo?offset=0&limit=25
// @request user_id(auth)
// @response success, items[], cnt

exports.getFriendsPost = async (req, res, next) => {
  let user_id = req.user.id;
  let offset = req.query.offset;
  let limit = req.query.limit;

  if (!user_id || !offset || !limit) {
    res.status(400).json();
    return;
  }

  let query = `select p.* from photo_follow as f join photo as p 
  on f.friend_user_id = p.user_id 
  where f.user_id = ${user_id} order by p.created_at desc limit ${offset} , ${limit}`;
  console.log(offset);
  console.log(limit);

  try {
    [rows] = await connection.query(query);
    res.status(200).json({ success: true, items: rows, cnt: rows.length });
  } catch (e) {
    res.status(500).json({ success: false });
  }
};
