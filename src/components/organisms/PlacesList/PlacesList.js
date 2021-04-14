import { useCallback, useEffect, useRef, useState } from "react";
import PlaceCard from "../../atoms/PlaceCard";
import Masonry from "react-responsive-masonry";
import sygicAxios from "../../../api/sygic";
import "./PlacesList.sass";
import { useHistory } from "react-router-dom";
import { Input } from "semantic-ui-react";

const COUNTRY_ID = 43;
const LOADING_NEW_PAGE_OFFSET = 100;
const PLACES_IN_PAGE = 20;

function PlacesList() {
  const history = useHistory();
  const placesListRef = useRef(null);
  const [shownPagesCount, setShownPagesCount] = useState(1);
  const [places, setPlaces] = useState([]);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchBarValue, setSearchBarValue] = useState(null);
  const [searchQuery, setSearchQuery] = useState(null);

  useEffect(() => {
    const url = searchQuery
      ? `
      /places/list?
      query=${searchQuery.replace(/\s/g, "%20")}&
      parents=country:${COUNTRY_ID}
      &offset=${(shownPagesCount - 1) * PLACES_IN_PAGE}
      &levels=poi
      &limit=${PLACES_IN_PAGE}
      `
      : `
      /places/list?
        parents=country:${COUNTRY_ID}
        &offset=${(shownPagesCount - 1) * PLACES_IN_PAGE}
        &levels=poi
        &limit=${PLACES_IN_PAGE}
        &categories=eating%7Ctraveling%7Cshopping
    `;

    setIsContentLoading(true);
    sygicAxios(url.replace(/\s/g, "")).then(({ data: { data } }) => {
      setPlaces(places => [...places, ...data.places]);
      setIsContentLoading(false);
    });
  }, [shownPagesCount, searchQuery]);

  const onScroll = useCallback(() => {
    if (!placesListRef.current) return;

    const windowPos = window.scrollY;
    const placesListBottomPos =
      placesListRef.current.getBoundingClientRect().bottom + windowPos;
    const windowBottomPos = windowPos + window.innerHeight;
    const offset = placesListBottomPos - windowBottomPos;

    if (offset < LOADING_NEW_PAGE_OFFSET) {
      if (!isContentLoading && !scrolled) {
        setScrolled(true);
        setShownPagesCount(pagesCount => pagesCount + 1);
        setScrolled(false);
      }
    }
  }, [isContentLoading, scrolled]);

  useEffect(() => {
    document.addEventListener("scroll", onScroll);

    return () => {
      document.removeEventListener("scroll", onScroll);
    };
  }, [onScroll]);

  return (
    <div className="places-list" ref={placesListRef}>
      <Input
        className="places-list__search-bar"
        size="huge"
        icon={{
          name: "search",
          circular: true,
          link: true,
          onClick: () => findPlace(searchBarValue),
        }}
        placeholder="Find Place..."
        onChange={e => setSearchBarValue(e.currentTarget.value)}
      />
      <Masonry gutter="2rem" columnsCount={4}>
        {places.map(placeInfo => (
          <PlaceCard
            className="place-list__card"
            key={placeInfo.id}
            fluid
            title={placeInfo.name}
            poster={placeInfo.thumbnail_url}
            description={placeInfo.perex}
            placeId={placeInfo.id}
            onClick={e => goToPlaceInfoPage(e.currentTarget.dataset.id)}
          />
        ))}
      </Masonry>
    </div>
  );

  function goToPlaceInfoPage(placeId) {
    history.push(`place/${placeId}`);
  }

  function findPlace(query) {
    setSearchQuery(query);
    setShownPagesCount(1);

    const url = `/places/list?
      query=${query.replace(/\s/g, "%20")}&
      parents=country:${COUNTRY_ID}
      &categories=eating%7Ctraveling%7Cshopping

    `;
    sygicAxios(url).then(({ data: { data } }) => setPlaces(data.places));
  }
}

export default PlacesList;
