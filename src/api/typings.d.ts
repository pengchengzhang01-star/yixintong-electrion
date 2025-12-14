declare namespace API {
  type Pagination = {
    pageNumber: number;
    showNumber: number;
  };
  declare namespace Login {
    enum UsedFor {
      Register = 1,
      Modify = 2,
      Login = 3,
    }
    type RegisterUserInfo = {
      nickname: string;
      faceURL: string;
      birth?: number;
      gender?: number;
      email?: string;
      account?: string;
      areaCode?: string;
      phoneNumber?: string;
      password: string;
    };
    type DemoRegisterType = {
      invitationCode?: string;
      verifyCode: string;
      deviceID?: string;
      autoLogin?: boolean;
      user: RegisterUserInfo;
    };
    type LoginParams = {
      verifyCode: string;
      deviceID?: string;
      areaCode: string;
      account?: string;
      phoneNumber?: string;
      email?: string;
      password: string;
    };
    type ModifyParams = {
      userID: string;
      currentPassword: string;
      newPassword: string;
    };
    type ResetParams = {
      phoneNumber: string;
      areaCode: string;
      verifyCode: string;
      password: string;
    };
    type VerifyCodeParams = {
      email?: string;
      phoneNumber?: string;
      areaCode?: string;
      verifyCode: string;
      usedFor: UsedFor;
    };
    type SendSmsParams = {
      email?: string;
      phoneNumber?: string;
      areaCode?: string;
      deviceID?: string;
      usedFor: UsedFor;
      invitationCode?: string;
    };
  }

  declare namespace User {}
  declare namespace Moments {
    type User = {
      userID: string;
      userName: string;
    };
    type PublishMomentsParams = {
      content: {
        metas: {
          original: string;
          thumb: string;
        }[];
        text: string;
        type: number;
      };
      permission: 0 | 1 | 2 | 3;
      atUserIDs?: string[];
      permissionUserIDs?: string[];
      permissionGroupIDs?: string[];
    };
    type DeleteCommentParams = {
      workMomentID: string;
      commentID: string;
    };
    type CreateCommentParams = {
      workMomentID: string;
      content: string;
      replyUserID: string;
      replyUserName: string;
    };
  }
  declare namespace AutoUpdate {
    type Version = {
      id: string;
      platform: string;
      version: string;
      url: string;
      text: string;
      force: boolean;
      latest: boolean;
      hot: boolean;
      createTime: number;
    };
  }

  declare namespace Agent {
    type Agent = {
      userID: string;
      nickname: string;
      faceURL: string;
      url: string;
      key: string;
      idtentity: string;
      model: string;
      prompts: string;
      createTime: number;
    };
  }

  declare namespace Collect {
    enum CollectType {
      Message = "3",
    }
    type CollectContent = {
      collectID: string;
      collectType: CollectType;
      content: string;
      createTime: number;
    };
    type AddCollectResp = {
      collectID: string;
      createTime: number;
    };
    type GetCollectResp = {
      count: number;
      collects: CollectContent[];
    };
  }
}
