/*************************************************************************************
 * CLASS NAME:  Forest
 * DESCRIPTION:
 * NOTE:
 *
 *************************************************************************************/
class Forest {
  constructor(content) {
    this.content = content;
    this.totalNum = content.reduce((acc, cur) => {
      return acc + cur.num;
    }, 0);
  }

  getTotalNum() {
    return this.totalNum;
  }

  getIdBySpecies(species) {
    const { content } = this;
    const id = content.findIndex((obj) => {
      return obj.species === species;
    });
    return id;
  }
}

export { Forest };
