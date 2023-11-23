class ApiFeature {
  constructor(modal, queryString) {
    this.modal = modal;
    this.query = modal.find();
    this.queryString = queryString;
  }

  filter() {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const queryObj = { ...this.queryString };

    ///exclude some query
    const excludePage = ['page', 'fields', 'sort', 'limit'];
    excludePage.forEach((el) => delete queryObj[el]);

    //////Advance filter

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const filterObj = JSON.parse(queryStr);

    this.query = this.query.find(filterObj);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');

      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt name _id');
    }
    return this;
  }

  limit() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');

      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    const page = +this.queryString.page || 1;
    const limitNum = +this.queryString.limit || 100;
    const skipNum = (page - 1) * limitNum;
    this.query = this.query.skip(skipNum).limit(limitNum);

    return this;
  }
}
module.exports = ApiFeature;
