export const uriToBlob = async uri => {
  const localFile = await fetch(uri);
  const imageBlob = await localFile.blob();
  return imageBlob;
};

export const uploadImage = async (tokens, blob) => {
  const imageUploadRequest = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/octet-stream",
      Authorization: `Bearer ${tokens.accessToken}`
    },
    body: blob
  };
  const imageResponse = await fetch(
    `https://upload.contentful.com/spaces/${tokens.spaceId}/uploads`,
    imageUploadRequest
  );
  return imageResponse.json();
};

export const processImage = async (tokens, assetId) => {
  await fetch(
    `https://api.contentful.com/spaces/${tokens.spaceId}/environments/master/assets/${assetId}/files/en-US/process`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    }
  );
};

export const publishImage = async (tokens, assetId, images, setImages) => {
  setTimeout(async () => {
    const publishedResponse = await fetch(
      `https://api.contentful.com/spaces/${tokens.spaceId}/environments/master/assets/${assetId}/published`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "X-Contentful-Version": 2
        }
      }
    );
    const image = await publishedResponse.json();
    const newImages = images.concat([image]);
    setImages(newImages);
  }, 1000);
};

export const linkUploadToAsset = async (tokens, id, fileName, contentType) => {
  const assetRequest = {
    fields: {
      title: {
        "en-US": fileName
      },
      file: {
        "en-US": {
          contentType,
          fileName,
          uploadFrom: {
            sys: {
              type: "Link",
              linkType: "Upload",
              id
            }
          }
        }
      }
    }
  };
  const assetResponse = await fetch(
    `https://api.contentful.com/spaces/${tokens.spaceId}/environments/master/assets`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.accessToken}`
      },
      body: JSON.stringify(assetRequest)
    }
  );
  return assetResponse.json();
};

export const createEntry = async (
  tokens,
  { title, body, isMilo, isOliver, images }
) => {
  const oliverTag = {
    sys: {
      id: "7lqX3SAtFmVC0ecUd49FrN",
      linkType: "Entry",
      type: "Link"
    }
  };
  const miloTag = {
    sys: {
      id: "7pc56m8PVtvdsCW3lHXvHF",
      linkType: "Entry",
      type: "Link"
    }
  };
  const tags = [miloTag, oliverTag].filter(
    (tag, i) => (i === 0 && isMilo) || (i === 1 && isOliver)
  );
  const entryRequest = {
    fields: {
      coverImages: {
        "en-US": images.map(image => ({
          sys: {
            type: "Link",
            linkType: "Asset",
            id: image.sys.id
          }
        }))
      },
      publishDate: {
        "en-US": new Date().toISOString()
      },
      shortDescription: {
        "en-US": title
      },
      body: {
        "en-US": body
      },
      tags: {
        "en-US": tags
      }
    }
  };
  const response = await fetch(
    `https://api.contentful.com/spaces/${tokens.spaceId}/environments/master/entries`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "X-Contentful-Content-Type": "post"
      },
      body: JSON.stringify(entryRequest)
    }
  );
  return await response.json();
};

export const publishEntry = async (tokens, id) => {
  await fetch(
    `https://api.contentful.com/spaces/${tokens.spaceId}/environments/master/entries/${id}/published`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "X-Contentful-Version": 1
      }
    }
  );
};
